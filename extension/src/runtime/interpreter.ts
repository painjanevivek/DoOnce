import type { RunRequest, RunResult, StepResult, WorkflowSpec, WorkflowStep } from "../../../contracts/protocol";
import type { ExecutionContext, ExecutorAdapter } from "./executor-adapter";

export interface InterpreterCheckpoint {
  currentStepIndex: number;
  stepResults: StepResult[];
  variables: Record<string, string>;
  observedUrl?: string;
  inFlightStepId?: string;
}

export interface InterpreterOptions {
  maxRetries?: number;
  checkpoint?: InterpreterCheckpoint;
  isCancellationRequested?: () => boolean | Promise<boolean>;
  onCheckpoint?: (checkpoint: InterpreterCheckpoint) => void | Promise<void>;
  now?: () => Date;
}

export async function executeWorkflow(request: RunRequest, workflow: WorkflowSpec, adapter: ExecutorAdapter, options: InterpreterOptions = {}): Promise<RunResult> {
  validateCompatibility(request, workflow, adapter);
  const now = options.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const maxRetries = Math.min(Math.max(options.maxRetries ?? 2, 0), 5);
  const stepResults = structuredClone(options.checkpoint?.stepResults ?? []);
  const variables = { ...request.inputs, ...options.checkpoint?.variables };
  let index = options.checkpoint?.currentStepIndex ?? 0;
  let transitions = 0;
  let finalStatus: RunResult["status"] = "completed";
  let reasonCode: string | undefined;

  try {
    await adapter.prepare(context(request.runId, request.inputs, variables));
    if (options.checkpoint?.inFlightStepId) { finalStatus = "paused"; reasonCode = "run.uncertain-action"; }
    while (index < workflow.steps.length) {
      if (finalStatus !== "completed") break;
      if (++transitions > workflow.steps.length * 3) { finalStatus = "failed"; reasonCode = "workflow.transition-limit"; break; }
      if (await options.isCancellationRequested?.()) { await adapter.cancel("run.cancelled"); finalStatus = "cancelled"; reasonCode = "run.cancelled"; break; }
      const step = workflow.steps[index]!;
      if (step.action === "branch") {
        const started = now().toISOString();
        const nextId = compare(variables[step.inputName] ?? "", step.operator, interpolate(step.expected, variables)) ? step.ifTrueStepId : step.ifFalseStepId;
        stepResults.push({ schemaVersion: 1, stepId: step.id, status: "verified", startedAt: started, finishedAt: now().toISOString(), outputs: { branch: nextId ?? "next" }, retryCount: 0 });
        index = nextId ? workflow.steps.findIndex((candidate) => candidate.id === nextId) : index + 1;
        if (index < 0) { finalStatus = "failed"; reasonCode = "workflow.branch-target-missing"; break; }
        await checkpoint(options, index, stepResults, variables);
        continue;
      }
      if (step.action === "stop") {
        const stoppedAt = now().toISOString();
        stepResults.push({ schemaVersion: 1, stepId: step.id, status: "paused", reasonCode: "workflow.stopped", startedAt: stoppedAt, finishedAt: stoppedAt, retryCount: 0 });
        finalStatus = "paused"; reasonCode = "workflow.stopped"; break;
      }

      const started = now().toISOString();
      let retryCount = 0;
      await checkpoint(options, index, stepResults, variables, undefined, step.id);
      let action = await adapter.execute(interpolateStep(step, variables), context(request.runId, request.inputs, variables));
      while (action.status !== "verified" && action.retryable && retryCount < maxRetries) {
        if (await options.isCancellationRequested?.()) { await adapter.cancel("run.cancelled"); finalStatus = "cancelled"; reasonCode = "run.cancelled"; break; }
        retryCount += 1;
        await checkpoint(options, index, stepResults, variables, undefined, step.id);
        action = await adapter.execute(interpolateStep(step, variables), context(request.runId, request.inputs, variables));
      }
      if (finalStatus === "cancelled") break;
      const evidenceRefs = [...(action.evidenceRefs ?? []), ...(adapter.evidence ? await adapter.evidence(step, action) : [])];
      const result: StepResult = {
        schemaVersion: 1, stepId: step.id, status: action.status, startedAt: started, finishedAt: now().toISOString(), retryCount,
        ...(action.reasonCode ? { reasonCode: action.reasonCode } : {}), ...(action.selectedLocator ? { selectedLocator: action.selectedLocator } : {}),
        ...(action.locatorConfidence !== undefined ? { locatorConfidence: action.locatorConfidence } : {}), ...(action.outputs ? { outputs: action.outputs } : {}),
        ...(evidenceRefs.length > 0 ? { evidenceRefs: [...new Set(evidenceRefs)] } : {}), ...(action.observedPage ? { observedPage: action.observedPage } : {}),
      };
      stepResults.push(result);
      Object.assign(variables, action.outputs);
      if (action.status !== "verified") { finalStatus = action.status === "failed" ? "failed" : "paused"; reasonCode = action.reasonCode ?? "step.unverified"; break; }
      index += 1;
      await checkpoint(options, index, stepResults, variables, action.observedPage?.origin ? `${action.observedPage.origin}${action.observedPage.path}` : undefined);
    }
  } catch {
    finalStatus = "failed";
    reasonCode = "executor.unexpected-error";
  } finally {
    await adapter.close();
  }
  return {
    schemaVersion: 1, format: "doonce.run-result.v1", runId: request.runId, workflowId: request.workflowId, workflowVersion: request.workflowVersion,
    status: finalStatus, ...(reasonCode ? { reasonCode } : {}), stepResults, startedAt, finishedAt: now().toISOString(),
  };
}

function validateCompatibility(request: RunRequest, workflow: WorkflowSpec, adapter: ExecutorAdapter): void {
  if (request.executor !== "extension") throw new TypeError("This interpreter requires the extension executor.");
  if (workflow.steps.length === 0) throw new TypeError("A workflow must contain at least one step.");
  const capabilities = adapter.capabilities();
  if (workflow.steps.length > capabilities.maxSteps) throw new TypeError("The workflow exceeds the executor step limit.");
  const unsupported = workflow.steps.find((step) => !capabilities.actions.includes(step.action));
  if (unsupported) throw new TypeError(`The executor does not support ${unsupported.action}.`);
}

async function checkpoint(options: InterpreterOptions, currentStepIndex: number, stepResults: StepResult[], variables: Record<string, string>, observedUrl?: string, inFlightStepId?: string): Promise<void> {
  await options.onCheckpoint?.({ currentStepIndex, stepResults: structuredClone(stepResults), variables: { ...variables }, ...(observedUrl ? { observedUrl } : {}), ...(inFlightStepId ? { inFlightStepId } : {}) });
}

function context(runId: string, inputs: Record<string, string>, variables: Record<string, string>): ExecutionContext { return { runId, inputs, variables }; }
function compare(actual: string, operator: "equals" | "contains" | "matches", expected: string): boolean { if (operator === "equals") return actual === expected; if (operator === "contains") return actual.includes(expected); try { return new RegExp(expected).test(actual); } catch { return false; } }
function interpolate(value: string, variables: Record<string, string>): string { return value.replace(/\$\{([a-zA-Z][a-zA-Z0-9_-]{0,63})\}/g, (_match, name: string) => variables[name] ?? ""); }
function interpolateStep(step: WorkflowStep, variables: Record<string, string>): WorkflowStep { const clone = structuredClone(step); if ("expected" in clone) clone.expected = interpolate(clone.expected, variables); if (clone.action === "ask-approval") clone.prompt = interpolate(clone.prompt, variables); return clone; }
