/* global chrome */

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(["doonce.consentedOrigins", "doonce.recordingOrigins"]);
  if (!Array.isArray(stored["doonce.consentedOrigins"])) {
    await chrome.storage.local.set({ "doonce.consentedOrigins": [] });
  }
  if (!Array.isArray(stored["doonce.recordingOrigins"])) {
    await chrome.storage.local.set({ "doonce.recordingOrigins": [] });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "doonce.capture" || !sender.tab?.id || !sender.url) return;
  void storeCaptureSummary(message, new URL(sender.url).origin);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "doonce.start-capture" || !Number.isInteger(message.tabId) || typeof message.origin !== "string") return;
  void setRecording(message.tabId, message.origin, true).then(
    (updated) => sendResponse({ updated }),
    () => sendResponse({ updated: false }),
  );
  return true;
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "doonce.set-recording" || !Number.isInteger(message.tabId) || typeof message.origin !== "string" || typeof message.enabled !== "boolean") return;
  void setRecording(message.tabId, message.origin, message.enabled).then(
    (updated) => sendResponse({ updated }),
    () => sendResponse({ updated: false }),
  );
  return true;
});

async function setRecording(tabId, origin, enabled) {
  const stored = await chrome.storage.local.get(["doonce.consentedOrigins", "doonce.recordingOrigins"]);
  if (!(stored["doonce.consentedOrigins"] ?? []).includes(origin)) return false;
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url || new URL(tab.url).origin !== origin) return false;
  try {
    await chrome.tabs.sendMessage(tabId, { type: enabled ? "doonce.start-capture" : "doonce.stop-capture" });
  } catch {
    if (!enabled) return false;
    await chrome.scripting.executeScript({ target: { tabId }, files: ["capture-policy.js", "content-capture.js"] });
    await chrome.tabs.sendMessage(tabId, { type: "doonce.start-capture" });
  }
  const recordingOrigins = new Set(stored["doonce.recordingOrigins"] ?? []);
  if (enabled) recordingOrigins.add(origin);
  else recordingOrigins.delete(origin);
  await chrome.storage.local.set({ "doonce.recordingOrigins": [...recordingOrigins] });
  return true;
}

async function storeCaptureSummary(message, senderOrigin) {
  if (message.origin !== senderOrigin || !isSummary(message.summary)) return;
  const stored = await chrome.storage.local.get(["doonce.consentedOrigins", "doonce.capturedSummaries"]);
  if (!(stored["doonce.consentedOrigins"] ?? []).includes(senderOrigin)) return;
  const summaries = stored["doonce.capturedSummaries"] ?? [];
  await chrome.storage.local.set({ "doonce.capturedSummaries": [...summaries, { origin: senderOrigin, ...message.summary }].slice(-50) });
}

function isSummary(summary) {
  return summary && ["click", "change", "input"].includes(summary.eventKind) && typeof summary.selector === "string" && summary.selector.length <= 256;
}
