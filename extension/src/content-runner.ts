import type { WorkflowStep } from "../../contracts/protocol";
import { DomExecutorAdapter } from "./runtime/dom-executor-adapter";
import type { ExecutionContext } from "./runtime/executor-adapter";

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isStepMessage(message)) return;
  const adapter = new DomExecutorAdapter();
  void adapter.prepare().then(() => adapter.execute(message.step, message.context)).then(sendResponse, () => sendResponse({ status: "failed", reasonCode: "executor.unexpected-error" })).finally(() => adapter.close());
  return true;
});

function isStepMessage(value: unknown): value is { type: "doonce.execute-step"; step: WorkflowStep; context: ExecutionContext } {
  return typeof value === "object" && value !== null && (value as Record<string, unknown>).type === "doonce.execute-step" && typeof (value as Record<string, unknown>).step === "object" && typeof (value as Record<string, unknown>).context === "object";
}
