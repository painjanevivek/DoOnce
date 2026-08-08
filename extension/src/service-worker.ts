import { normalizeRecordedPath, type RecordedEventSummary } from "./capture-eligibility";
import { canRunDemo } from "./run-eligibility";
import { createRunNotification, type PauseReason, type RunResult } from "./run-notification";

interface CaptureMessage {
  type: "doonce.capture";
  origin: string;
  path: string;
  summary: RecordedEventSummary;
}

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(["doonce.consentedOrigins", "doonce.recordingOrigins"]);
  const initialValues: Record<string, string[]> = {};
  if (!Array.isArray(stored["doonce.consentedOrigins"])) initialValues["doonce.consentedOrigins"] = [];
  if (!Array.isArray(stored["doonce.recordingOrigins"])) initialValues["doonce.recordingOrigins"] = [];
  if (Object.keys(initialValues).length > 0) await chrome.storage.local.set(initialValues);
});

chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  if (!isCaptureMessage(message) || !sender.tab?.id || !sender.url) return;
  const senderUrl = new URL(sender.url);
  void storeCaptureSummary(message, senderUrl.origin, senderUrl.pathname);
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isRecord(message) || message.type !== "doonce.start-capture" || !Number.isInteger(message.tabId) || typeof message.origin !== "string") return;
  void setRecording(message.tabId as number, message.origin, true).then(
    (updated) => sendResponse({ updated }),
    () => sendResponse({ updated: false }),
  );
  return true;
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isRecord(message) || message.type !== "doonce.set-recording" || !Number.isInteger(message.tabId) || typeof message.origin !== "string" || typeof message.enabled !== "boolean") return;
  void setRecording(message.tabId as number, message.origin, message.enabled).then(
    (updated) => sendResponse({ updated }),
    () => sendResponse({ updated: false }),
  );
  return true;
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isRecord(message) || message.type !== "doonce.run-demo-download" || !Number.isInteger(message.tabId) || typeof message.origin !== "string") return;
  void runDemoDownload(message.tabId as number, message.origin).then(sendResponse, () => sendResponse({ outcome: "paused", reasonCode: "unknown", reason: "The demo run could not start." } satisfies RunResult));
  return true;
});

async function setRecording(tabId: number, origin: string, enabled: boolean): Promise<boolean> {
  const stored = await chrome.storage.local.get(["doonce.consentedOrigins", "doonce.recordingOrigins"]);
  if (!stringArray(stored["doonce.consentedOrigins"]).includes(origin)) return false;
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url || new URL(tab.url).origin !== origin) return false;
  try {
    await chrome.tabs.sendMessage(tabId, { type: enabled ? "doonce.start-capture" : "doonce.stop-capture" });
  } catch {
    if (!enabled) return false;
    await chrome.scripting.executeScript({ target: { tabId }, files: ["dist/content-capture.js"] });
    await chrome.tabs.sendMessage(tabId, { type: "doonce.start-capture" });
  }
  const recordingOrigins = new Set(stringArray(stored["doonce.recordingOrigins"]));
  if (enabled) recordingOrigins.add(origin);
  else recordingOrigins.delete(origin);
  await chrome.storage.local.set({ "doonce.recordingOrigins": [...recordingOrigins] });
  return true;
}

async function runDemoDownload(tabId: number, origin: string): Promise<RunResult> {
  const stored = await chrome.storage.local.get("doonce.consentedOrigins");
  let result: unknown = { outcome: "paused", reasonCode: "unknown", reason: "The demo run could not be verified." };
  try {
    const tab = await chrome.tabs.get(tabId);
    const consentedOrigins = stringArray(stored["doonce.consentedOrigins"]);
    if (!consentedOrigins.includes(origin) || !tab.url || new URL(tab.url).origin !== origin || !canRunDemo(tab.url, consentedOrigins)) {
      result = { outcome: "paused", reasonCode: "unknown", reason: "The requested local run is not available." };
    } else {
      try {
        result = await chrome.tabs.sendMessage(tabId, { type: "doonce.run-demo-download" });
      } catch {
        await chrome.scripting.executeScript({ target: { tabId }, files: ["dist/demo-runner.js"] });
        result = await chrome.tabs.sendMessage(tabId, { type: "doonce.run-demo-download" });
      }
    }
  } catch {
    result = { outcome: "paused", reasonCode: "unknown", reason: "The demo run could not be verified." };
  }
  const normalized = normalizeRunResult(result);
  await storeDemoReceipt(origin, normalized);
  void notifyDemoRun(normalized);
  return normalized;
}

async function notifyDemoRun(result: RunResult): Promise<void> {
  try {
    await createRunNotification(chrome.notifications, result, chrome.runtime.getURL("notification-icon.svg"), `doonce-run-${crypto.randomUUID()}`);
  } catch {
    // Notification availability must never alter the verified run result or receipt.
  }
}

async function storeDemoReceipt(origin: string, result: RunResult): Promise<void> {
  const stored = await chrome.storage.local.get("doonce.demoRunReceipts");
  const existing = Array.isArray(stored["doonce.demoRunReceipts"]) ? stored["doonce.demoRunReceipts"] : [];
  const receipt = {
    id: crypto.randomUUID(),
    origin,
    outcome: result.outcome,
    ...(result.outcome === "paused" ? { pauseReason: result.reasonCode } : {}),
    stepOutcomes: [{ stepId: "demo-download", outcome: result.outcome === "completed" ? "verified" : "paused" }],
    finishedAt: new Date().toISOString(),
  };
  await chrome.storage.local.set({ "doonce.demoRunReceipts": [...existing, receipt].slice(-20) });
}

async function storeCaptureSummary(message: CaptureMessage, senderOrigin: string, senderPath: string): Promise<void> {
  if (message.origin !== senderOrigin || normalizeRecordedPath(message.path) === undefined || senderPath !== message.path) return;
  const stored = await chrome.storage.local.get(["doonce.consentedOrigins", "doonce.capturedSummaries"]);
  if (!stringArray(stored["doonce.consentedOrigins"]).includes(senderOrigin)) return;
  const summaries = Array.isArray(stored["doonce.capturedSummaries"]) ? stored["doonce.capturedSummaries"] : [];
  await chrome.storage.local.set({ "doonce.capturedSummaries": [...summaries, { origin: senderOrigin, path: message.path, ...message.summary }].slice(-50) });
}

function normalizeRunResult(value: unknown): RunResult {
  if (isRecord(value) && value.outcome === "completed") return { outcome: "completed" };
  const reasonCode = isRecord(value) && isPauseReason(value.reasonCode) ? value.reasonCode : "unknown";
  const reason = isRecord(value) && typeof value.reason === "string" ? value.reason.slice(0, 160) : "The demo run could not be verified.";
  return { outcome: "paused", reasonCode, reason };
}

function isCaptureMessage(value: unknown): value is CaptureMessage {
  if (!isRecord(value) || value.type !== "doonce.capture" || typeof value.origin !== "string" || typeof value.path !== "string" || !isRecord(value.summary)) return false;
  return (value.summary.eventKind === "click" || value.summary.eventKind === "change" || value.summary.eventKind === "input")
    && typeof value.summary.selector === "string"
    && value.summary.selector.length > 0
    && value.summary.selector.length <= 256
    && (value.summary.actionHint === undefined || value.summary.actionHint === "download")
    && Object.keys(value.summary).every((key) => ["eventKind", "selector", "actionHint"].includes(key));
}

function isPauseReason(value: unknown): value is PauseReason {
  return value === "changed-page" || value === "slow-network" || value === "unknown";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
