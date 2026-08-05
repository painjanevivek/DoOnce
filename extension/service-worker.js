/* global chrome */

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get("doonce.consentedOrigins");
  if (!Array.isArray(stored["doonce.consentedOrigins"])) {
    await chrome.storage.local.set({ "doonce.consentedOrigins": [] });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "doonce.capture" || !sender.tab?.id || !sender.url) return;
  void storeCaptureSummary(message, new URL(sender.url).origin);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "doonce.start-capture" || !Number.isInteger(message.tabId) || typeof message.origin !== "string") return;
  void startCapture(message.tabId, message.origin);
});

async function startCapture(tabId, origin) {
  const stored = await chrome.storage.local.get("doonce.consentedOrigins");
  if (!(stored["doonce.consentedOrigins"] ?? []).includes(origin)) return;
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url || new URL(tab.url).origin !== origin) return;
  try {
    await chrome.tabs.sendMessage(tabId, { type: "doonce.start-capture" });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["capture-policy.js", "content-capture.js"] });
    await chrome.tabs.sendMessage(tabId, { type: "doonce.start-capture" });
  }
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
