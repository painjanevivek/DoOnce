import type { RunRequest, RunResult, WorkflowSpec } from "../../../contracts/protocol";
import type { InterpreterCheckpoint } from "./interpreter";

export interface ExecutionRunView { id: string; cancelRequested: boolean; status: string; mode: "test" | "production" }
export interface RunLease { run: ExecutionRunView; request: RunRequest; workflow: WorkflowSpec; checkpoint?: InterpreterCheckpoint; leaseToken: string; leaseExpiresAt: string }

export interface RunTransport {
  claim(): Promise<RunLease | undefined>;
  heartbeat(runId: string, leaseToken: string): Promise<ExecutionRunView | undefined>;
  checkpoint(runId: string, leaseToken: string, checkpoint: InterpreterCheckpoint): Promise<boolean>;
  finish(runId: string, leaseToken: string, result: RunResult): Promise<boolean>;
  uploadArtifact(runId: string, leaseToken: string, input: { fileName: string; contentType: string; retentionClass: "debug" | "workflow-output" | "publication-evidence" | "pinned"; stepId?: string; base64: string }): Promise<boolean>;
}

export function createHttpRunTransport(apiBaseUrl: string, token: string, extensionVersion: string): RunTransport {
  const request = async (path: string, body: unknown): Promise<Response> => fetch(`${apiBaseUrl}${path}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json", "X-DoOnce-Extension-Version": extensionVersion }, body: JSON.stringify(body) });
  return {
    async claim() {
      const response = await request("/api/v1/extension/runs/claim", { extensionVersion, capabilities: ["workflow-spec-v1", "semantic-locators", "event-waits", "checkpoints", "navigation-reinjection"] });
      if (response.status === 204) return undefined;
      if (!response.ok) throw new TypeError("Run claim was rejected.");
      const body: unknown = await response.json();
      return isRecord(body) && isRunLease(body.lease) ? body.lease : (() => { throw new TypeError("Run claim response is invalid."); })();
    },
    async heartbeat(runId, leaseToken) {
      const response = await request(`/api/v1/extension/runs/${runId}/heartbeat`, { leaseToken });
      if (response.status === 409) return undefined;
      if (!response.ok) throw new TypeError("Run heartbeat was rejected.");
      const body: unknown = await response.json();
      return isRecord(body) && isRecord(body.run) && typeof body.run.id === "string" && typeof body.run.cancelRequested === "boolean" ? body.run as unknown as ExecutionRunView : undefined;
    },
    async checkpoint(runId, leaseToken, checkpoint) { return (await request(`/api/v1/extension/runs/${runId}/checkpoint`, { leaseToken, checkpoint: redactCheckpoint(checkpoint) })).ok; },
    async finish(runId, leaseToken, result) { return (await request(`/api/v1/extension/runs/${runId}/result`, { leaseToken, result: redactRunResult(result) })).ok; },
    async uploadArtifact(runId, leaseToken, input) { return (await request(`/api/v1/runs/${runId}/artifacts`, { ...input, leaseToken })).ok; },
  };
}

export function redactCheckpoint(checkpoint: InterpreterCheckpoint): InterpreterCheckpoint {
  return {
    currentStepIndex: checkpoint.currentStepIndex,
    stepResults: checkpoint.stepResults.map(redactStepResult),
    variables: {},
    ...(checkpoint.observedUrl ? { observedUrl: stripQuery(checkpoint.observedUrl) } : {}),
    ...(checkpoint.inFlightStepId ? { inFlightStepId: checkpoint.inFlightStepId } : {}),
  };
}

export function redactRunResult(result: RunResult): RunResult {
  return {
    ...result,
    stepResults: result.stepResults.map(redactStepResult),
    ...(result.assertionResults ? { assertionResults: result.assertionResults.map(redactAssertionResult) } : {}),
  };
}

function redactStepResult(step: RunResult["stepResults"][number]): RunResult["stepResults"][number] {
  const safe = structuredClone(step);
  delete safe.outputs;
  delete safe.selectedLocator;
  delete safe.observedPage;
  delete safe.repairCandidates;
  if (safe.assertionResults) safe.assertionResults = safe.assertionResults.map(redactAssertionResult);
  return safe;
}

function redactAssertionResult(assertion: NonNullable<RunResult["assertionResults"]>[number]): NonNullable<RunResult["assertionResults"]>[number] {
  const safe = structuredClone(assertion);
  delete safe.observed;
  return safe;
}

function stripQuery(value: string): string {
  try { const url = new URL(value); return `${url.origin}${url.pathname}`; }
  catch { return ""; }
}

function isRunLease(value: unknown): value is RunLease { return isRecord(value) && isRecord(value.run) && (value.run.mode === "test" || value.run.mode === "production") && isRecord(value.request) && isRecord(value.workflow) && typeof value.leaseToken === "string" && typeof value.leaseExpiresAt === "string"; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
