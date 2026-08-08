/* global chrome */

importScripts("run-policy.js", "run-notification.js");

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
  const senderUrl = new URL(sender.url);
  void storeCaptureSummary(message, senderUrl.origin, senderUrl.pathname);
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "doonce.run-demo-download" || !Number.isInteger(message.tabId) || typeof message.origin !== "string") return;
  void runDemoDownload(message.tabId, message.origin).then(sendResponse, () => sendResponse({ outcome: "paused", reason: "The demo run could not start." }));
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

async function runDemoDownload(tabId, origin) {
  const stored = await chrome.storage.local.get("doonce.consentedOrigins");
  let result = { outcome: "paused", reasonCode: "unknown", reason: "The demo run could not be verified." };
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!(stored["doonce.consentedOrigins"] ?? []).includes(origin) || !tab.url || new URL(tab.url).origin !== origin || !DoOnceRunPolicy.canRunDemo(tab.url, stored["doonce.consentedOrigins"])) {
      result = { outcome: "paused", reasonCode: "unknown", reason: "The requested local run is not available." };
    } else {
      try {
        result = await chrome.tabs.sendMessage(tabId, { type: "doonce.run-demo-download" });
      } catch {
        await chrome.scripting.executeScript({ target: { tabId }, files: ["demo-runner.js"] });
        result = await chrome.tabs.sendMessage(tabId, { type: "doonce.run-demo-download" });
      }
    }
  } catch {
    result = { outcome: "paused", reasonCode: "unknown", reason: "The demo run could not be verified." };
  }
  const normalized = result?.outcome === "completed" ? { outcome: "completed" } : { outcome: "paused", reasonCode: ["changed-page", "slow-network", "unknown"].includes(result?.reasonCode) ? result.reasonCode : "unknown", reason: typeof result?.reason === "string" ? result.reason.slice(0, 160) : "The demo run could not be verified." };
  await storeDemoReceipt(origin, normalized);
  void notifyDemoRun(normalized);
  return normalized;
}

async function notifyDemoRun(result) {
  try {
    await DoOnceRunNotification.createRunNotification(chrome.notifications, result, chrome.runtime.getURL("notification-icon.svg"), `doonce-run-${crypto.randomUUID()}`);
  } catch {
    // Notification availability must never alter a verified run result or receipt.
  }
}

async function storeDemoReceipt(origin, result) {
  const stored = await chrome.storage.local.get("doonce.demoRunReceipts");
  const receipt = { id: crypto.randomUUID(), origin, outcome: result.outcome, ...(result.outcome === "paused" ? { pauseReason: result.reasonCode } : {}), stepOutcomes: [{ stepId: "demo-download", outcome: result.outcome === "completed" ? "verified" : "paused" }], finishedAt: new Date().toISOString() };
  await chrome.storage.local.set({ "doonce.demoRunReceipts": [...(stored["doonce.demoRunReceipts"] ?? []), receipt].slice(-20) });
}

async function storeCaptureSummary(message, senderOrigin, senderPath) {
  if (message.origin !== senderOrigin || !isSummary(message.summary) || !isSafePath(message.path)) return;
  if (senderPath !== message.path) return;
  const stored = await chrome.storage.local.get(["doonce.consentedOrigins", "doonce.capturedSummaries"]);
  if (!(stored["doonce.consentedOrigins"] ?? []).includes(senderOrigin)) return;
  const summaries = stored["doonce.capturedSummaries"] ?? [];
  const summary = { eventKind: message.summary.eventKind, selector: message.summary.selector, ...(message.summary.actionHint === "download" ? { actionHint: "download" } : {}) };
  await chrome.storage.local.set({ "doonce.capturedSummaries": [...summaries, { origin: senderOrigin, path: message.path, ...summary }].slice(-50) });
}

function isSummary(summary) {
  return summary && typeof summary === "object" && Object.keys(summary).every((key) => ["eventKind", "selector", "actionHint"].includes(key)) && ["click", "change", "input"].includes(summary.eventKind) && typeof summary.selector === "string" && summary.selector.length <= 256 && (summary.actionHint === undefined || summary.actionHint === "download");
}

function isSafePath(path) {
  return typeof path === "string" && path.length > 0 && path.length <= 2048 && path.startsWith("/") && !path.startsWith("//") && !path.includes("..");
}
