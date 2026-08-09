import assert from "node:assert/strict";
import test from "node:test";
import type { AssertionResult, RunRequest, WorkflowAssertion, WorkflowSpec, WorkflowStep } from "../../../contracts/protocol";
import type { ActionExecutionResult, ExecutionContext, ExecutorAdapter, ExecutorCapabilities } from "./executor-adapter";
import { executeWorkflow, type InterpreterCheckpoint } from "./interpreter";

const ids = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333", "44444444-4444-4444-8444-444444444444"];
const request: RunRequest = { schemaVersion: 1, runId: ids[0]!, workflowId: ids[1]!, workflowVersion: 1, executor: "extension", inputs: { region: "north" }, requestedAt: "2026-08-09T00:00:00.000Z" };

class FakeAdapter implements ExecutorAdapter {
  public calls: string[] = [];
  public attempts = new Map<string, number>();
  public closed = false;
  public cancelled = false;
  public verificationCalls: Array<{ assertions: readonly WorkflowAssertion[]; context: ExecutionContext }> = [];
  public constructor(private readonly outcomes: Record<string, ActionExecutionResult> = {}, private readonly verificationResults: AssertionResult[] = []) {}
  public capabilities(): ExecutorCapabilities { return { executor: "extension", actions: ["navigate", "wait", "read", "compare", "branch", "stop", "ask-approval", "type", "select", "download"], maxSteps: 100, supportsDownloads: true, features: [] }; }
  public async prepare(): Promise<void> {}
  public async execute(step: WorkflowStep): Promise<ActionExecutionResult> { this.calls.push(step.id); this.attempts.set(step.id, (this.attempts.get(step.id) ?? 0) + 1); return this.outcomes[step.id] ?? { status: "verified" }; }
  public async verify(assertions: readonly WorkflowAssertion[], context: ExecutionContext): Promise<AssertionResult[]> { this.verificationCalls.push({ assertions, context }); return this.verificationResults; }
  public async cancel(): Promise<void> { this.cancelled = true; }
  public async close(): Promise<void> { this.closed = true; }
}

function spec(steps: WorkflowStep[]): WorkflowSpec { return { schemaVersion: 1, format: "doonce.workflow-spec.v1", title: "Test", allowedDomains: ["example.test"], inputs: [], steps }; }
function navigate(id: string, name = "Open"): WorkflowStep { return { id, action: "navigate", name, expectedOutcome: "Opened", target: { domain: "example.test", path: "/" } }; }

test("executes sequential steps and publishes resumable checkpoints", async () => {
  const adapter = new FakeAdapter({ [ids[2]!]: { status: "verified", outputs: { total: "42" }, evidenceRefs: ["dom:total"] } });
  const checkpoints: InterpreterCheckpoint[] = [];
  const result = await executeWorkflow(request, spec([navigate(ids[2]!), navigate(ids[3]!)]), adapter, { onCheckpoint: (value) => { checkpoints.push(value); } });
  assert.equal(result.status, "completed");
  assert.deepEqual(adapter.calls, [ids[2], ids[3]]);
  assert.equal(result.stepResults[0]?.outputs?.total, "42");
  assert.equal(checkpoints.at(-1)?.currentStepIndex, 2);
  assert.equal(adapter.closed, true);
});

test("uses a forward branch without asking the executor to run control flow", async () => {
  const branch: WorkflowStep = { id: ids[2]!, action: "branch", name: "Choose", expectedOutcome: "Selected", inputName: "region", operator: "equals", expected: "north", ifTrueStepId: ids[3]! };
  const adapter = new FakeAdapter();
  const result = await executeWorkflow(request, spec([branch, navigate(ids[3]!)]), adapter);
  assert.equal(result.status, "completed");
  assert.deepEqual(adapter.calls, [ids[3]]);
  assert.equal(result.stepResults[0]?.outputs?.branch, ids[3]);
});

test("retries only explicitly retryable outcomes and reports a stable failure", async () => {
  const adapter = new FakeAdapter({ [ids[2]!]: { status: "paused", reasonCode: "wait.timeout", retryable: true } });
  const result = await executeWorkflow(request, spec([navigate(ids[2]!)]), adapter, { maxRetries: 2 });
  assert.equal(result.status, "paused");
  assert.equal(result.reasonCode, "wait.timeout");
  assert.equal(result.stepResults[0]?.retryCount, 2);
  assert.equal(adapter.attempts.get(ids[2]!), 3);
});

test("resumes after a persisted checkpoint without duplicating completed actions", async () => {
  const adapter = new FakeAdapter();
  const result = await executeWorkflow(request, spec([navigate(ids[2]!), navigate(ids[3]!)]), adapter, { checkpoint: { currentStepIndex: 1, stepResults: [{ schemaVersion: 1, stepId: ids[2]!, status: "verified", startedAt: request.requestedAt, finishedAt: request.requestedAt }], variables: {} } });
  assert.deepEqual(adapter.calls, [ids[3]]);
  assert.equal(result.stepResults.length, 2);
});

test("honors cancellation before the next side effect", async () => {
  const adapter = new FakeAdapter();
  const result = await executeWorkflow(request, spec([navigate(ids[2]!)]), adapter, { isCancellationRequested: () => true });
  assert.equal(result.status, "cancelled");
  assert.deepEqual(adapter.calls, []);
  assert.equal(adapter.cancelled, true);
});

test("pauses an interrupted in-flight action instead of duplicating its side effect", async () => {
  const adapter = new FakeAdapter();
  const result = await executeWorkflow(request, spec([navigate(ids[2]!)]), adapter, { checkpoint: { currentStepIndex: 0, stepResults: [], variables: {}, inFlightStepId: ids[2]! } });
  assert.equal(result.status, "paused");
  assert.equal(result.reasonCode, "run.uncertain-action");
  assert.deepEqual(adapter.calls, []);
});

test("does not complete when an outcome assertion fails after a successful action", async () => {
  const assertionId = "55555555-5555-4555-8555-555555555555";
  const step = { ...navigate(ids[2]!), assertions: [{ id: assertionId, name: "Page ready", kind: "url-match" as const, operator: "contains" as const, expected: "/ready" }] };
  const adapter = new FakeAdapter({}, [{ schemaVersion: 1, assertionId, status: "failed", reasonCode: "assertion.url-mismatch", verifiedAt: request.requestedAt }]);
  const result = await executeWorkflow(request, spec([step]), adapter);
  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "assertion.failed");
  assert.equal(result.stepResults[0]?.status, "failed");
});

test("verifies a step against its newly produced output with interpolated expectations", async () => {
  const assertionId = "55555555-5555-4555-8555-555555555555";
  const step = { ...navigate(ids[2]!), assertions: [{ id: assertionId, name: "Output matches", kind: "extracted-value" as const, outputName: "total", operator: "equals" as const, expected: "${expected_total}" }] };
  const adapter = new FakeAdapter({ [ids[2]!]: { status: "verified", outputs: { total: "42" } } }, [{ schemaVersion: 1, assertionId, status: "verified", verifiedAt: request.requestedAt }]);
  await executeWorkflow({ ...request, inputs: { expected_total: "42" } }, spec([step]), adapter);
  assert.equal((adapter.verificationCalls[0]?.assertions[0] as Extract<WorkflowAssertion, { kind: "extracted-value" }>).expected, "42");
  assert.equal(adapter.verificationCalls[0]?.context.variables.total, "42");
});
