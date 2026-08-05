/* global chrome, DoOnceCapturePolicy */

let recording = false;

function safeSelector(target) {
  if (!(target instanceof Element)) return undefined;
  if (target.id && !/pass|otp|card|token|secret/i.test(target.id)) return `#${CSS.escape(target.id)}`;
  const captureId = target.getAttribute("data-doonce-capture-id");
  return captureId && /^[a-z0-9-]{1,64}$/i.test(captureId) ? `[data-doonce-capture-id="${captureId}"]` : undefined;
}

function capture(event) {
  if (!recording || !(event.target instanceof HTMLElement)) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) && !DoOnceCapturePolicy.canObserveField(event.target)) return;
  const selector = safeSelector(event.target);
  const summary = selector ? DoOnceCapturePolicy.safeEventSummary(event.type, selector) : undefined;
  const path = DoOnceCapturePolicy.safePath(location.pathname);
  if (summary && path) chrome.runtime.sendMessage({ type: "doonce.capture", origin: location.origin, path, summary });
}

document.addEventListener("click", capture, true);
document.addEventListener("change", capture, true);
document.addEventListener("input", capture, true);
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "doonce.start-capture") recording = true;
  if (message?.type === "doonce.stop-capture") recording = false;
  if (message?.type === "doonce.capture-status") sendResponse({ recording });
});
