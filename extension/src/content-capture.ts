import { canObserveField, createRecordedEventSummary, normalizeRecordedPath } from "./capture-eligibility";

let recording = false;

function buildLocatorCandidate(target: EventTarget | null): string | undefined {
  if (!(target instanceof Element)) return undefined;
  if (target.id && !/pass|otp|card|token|secret/i.test(target.id)) return `#${CSS.escape(target.id)}`;
  const captureId = target.getAttribute("data-doonce-capture-id");
  return captureId && /^[a-z0-9-]{1,64}$/i.test(captureId) ? `[data-doonce-capture-id="${captureId}"]` : undefined;
}

function inferActionHint(target: HTMLElement): "download" | undefined {
  return target.getAttribute("data-doonce-safe-action") === "download" ? "download" : undefined;
}

function capture(event: Event): void {
  if (!recording || !(event.target instanceof HTMLElement)) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) && !canObserveField(event.target)) return;
  const selector = buildLocatorCandidate(event.target);
  const summary = selector ? createRecordedEventSummary(event.type, selector, inferActionHint(event.target)) : undefined;
  const path = normalizeRecordedPath(location.pathname);
  if (summary && path) void chrome.runtime.sendMessage({ type: "doonce.capture", origin: location.origin, path, summary });
}

document.addEventListener("click", capture, true);
document.addEventListener("change", capture, true);
document.addEventListener("input", capture, true);
chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isRecord(message)) return;
  if (message.type === "doonce.start-capture") recording = true;
  if (message.type === "doonce.stop-capture") recording = false;
  if (message.type === "doonce.capture-status") sendResponse({ recording });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
