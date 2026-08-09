import type { RunRequest, RunResult, WorkflowSpec } from "../../../contracts/protocol";
import type { InterpreterCheckpoint } from "./interpreter";

export interface ExecutionRunView { id: string; cancelRequested: boolean; status: string }
export interface RunLease { run: ExecutionRunView; request: RunRequest; workflow: WorkflowSpec; checkpoint?: InterpreterCheckpoint; leaseToken: string; leaseExpiresAt: string }

export interface RunTransport {
  claim(): Promise<RunLease | undefined>;
  heartbeat(runId: string, leaseToken: string): Promise<ExecutionRunView | undefined>;
  checkpoint(runId: string, leaseToken: string, checkpoint: InterpreterCheckpoint): Promise<boolean>;
  finish(runId: string, leaseToken: string, result: RunResult): Promise<boolean>;
}

export function createHttpRunTransport(apiBaseUrl: string, token: string, extensionVersion: string): RunTransport {
  const request = async (path: string, body: unknown): Promise<Response> => fetch(`${apiBaseUrl}${path}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) });
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
    async checkpoint(runId, leaseToken, checkpoint) { return (await request(`/api/v1/extension/runs/${runId}/checkpoint`, { leaseToken, checkpoint })).ok; },
    async finish(runId, leaseToken, result) { return (await request(`/api/v1/extension/runs/${runId}/result`, { leaseToken, result })).ok; },
  };
}

function isRunLease(value: unknown): value is RunLease { return isRecord(value) && isRecord(value.run) && isRecord(value.request) && isRecord(value.workflow) && typeof value.leaseToken === "string" && typeof value.leaseExpiresAt === "string"; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
