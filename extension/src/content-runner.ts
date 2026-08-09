import type { WorkflowStep } from "../../contracts/protocol";
import { DomExecutorAdapter } from "./runtime/dom-executor-adapter";
import type { ExecutionContext } from "./runtime/executor-adapter";

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isStepMessage(message)) return;
  const adapter = new DomExecutorAdapter();
  void adapter.prepare().then(() => adapter.execute(message.step, message.context)).then(sendResponse, () => sendResponse({ status: "failed", reasonCode: "executor.unexpected-error" })).finally(() => adapter.close());
  return true;
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isAssertionMessage(message)) return;
  const adapter = new DomExecutorAdapter(message.downloads, (assertion) => window.confirm(assertion.prompt));
  void adapter.prepare().then(() => adapter.verify(message.assertions, message.context)).then(sendResponse, () => sendResponse([])).finally(() => adapter.close());
  return true;
});

function isStepMessage(value: unknown): value is { type: "doonce.execute-step"; step: WorkflowStep; context: ExecutionContext } {
  return typeof value === "object" && value !== null && (value as Record<string, unknown>).type === "doonce.execute-step" && typeof (value as Record<string, unknown>).step === "object" && typeof (value as Record<string, unknown>).context === "object";
}
function isAssertionMessage(value: unknown): value is { type: "doonce.verify-assertions"; assertions: import("../../contracts/protocol").WorkflowAssertion[]; context: ExecutionContext; downloads: import("./runtime/assertion-evaluator").DownloadObservation[] } {
  return typeof value === "object" && value !== null && (value as Record<string, unknown>).type === "doonce.verify-assertions" && Array.isArray((value as Record<string, unknown>).assertions) && typeof (value as Record<string, unknown>).context === "object" && Array.isArray((value as Record<string, unknown>).downloads);
}
