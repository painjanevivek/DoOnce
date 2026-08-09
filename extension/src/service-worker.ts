import { normalizeRecordedPath, type RecordedEventSummary } from "./capture-eligibility";
import { canRunDemo } from "./run-eligibility";
import { createRunNotification, type PauseReason, type RunResult } from "./run-notification";
import type { CaptureSession, RecordedAction } from "../../contracts/protocol";
import { validateContract } from "../../contracts/validation";
import type { CaptureObservation } from "./content-capture";
import { appendCaptureAction, createCaptureSession, transitionCaptureSession } from "./capture-session";
import { discardCaptureSession, loadCaptureSession, saveCaptureSession } from "./capture-storage";
import { createHttpCaptureTransport, synchronizeCaptureSession } from "./capture-sync";
import { ChromeExecutorAdapter } from "./runtime/chrome-executor-adapter";
import { executeWorkflow } from "./runtime/interpreter";
import { createHttpRunTransport } from "./runtime/run-transport";
import type { RunResult as ProtocolRunResult } from "../../contracts/protocol";

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
  await chrome.alarms.create("doonce.capture-sync", { periodInMinutes: 1 });
  await chrome.alarms.create("doonce.run-poll", { periodInMinutes: 0.5 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "doonce.capture-sync") void synchronizeStoredCapture(false);
  if (alarm.name === "doonce.run-poll") void pollForWorkflowRun();
});

chrome.runtime.onStartup.addListener(() => { void synchronizeStoredCapture(false); void pollForWorkflowRun(); });

chrome.downloads.onCreated.addListener(() => { void recordBrowserEvent("download-start"); });
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state?.current === "complete") void recordBrowserEvent("download-complete");
});
chrome.tabs.onCreated.addListener((tab) => { void recordBrowserEvent("tab-create", tab.id); });
chrome.tabs.onActivated.addListener((activeInfo) => { void recordBrowserEvent("tab-switch", activeInfo.tabId); });

chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  if (!isCaptureMessage(message) || !sender.tab?.id || !sender.url) return;
  const senderUrl = new URL(sender.url);
  void storeCaptureSummary(message, senderUrl.origin, senderUrl.pathname);
});

chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  if (!isCaptureObservationMessage(message) || !sender.tab?.id || !sender.url) return;
  void storeCaptureObservation(message.observation, sender.tab.id, sender.frameId ?? 0, new URL(sender.url));
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
    await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ["dist/content-capture.js"] });
    await chrome.tabs.sendMessage(tabId, { type: "doonce.start-capture" });
  }
  const recordingOrigins = new Set(stringArray(stored["doonce.recordingOrigins"]));
  if (enabled) recordingOrigins.add(origin);
  else recordingOrigins.delete(origin);
  await chrome.storage.local.set({ "doonce.recordingOrigins": [...recordingOrigins] });
  await updateCaptureSession(origin, enabled);
  return true;
}

async function updateCaptureSession(origin: string, enabled: boolean): Promise<void> {
  const existing = await loadCaptureSession(chrome.storage.local);
  const now = new Date().toISOString();
  let session: CaptureSession;
  if (enabled) {
    session = !existing || existing.status === "finalized" || existing.status === "discarded" || existing.status === "stopped"
      ? createCaptureSession(origin, chrome.runtime.getManifest().version, now)
      : existing.status === "paused" ? transitionCaptureSession(existing, "resume", now) : existing;
  } else {
    if (!existing || existing.status !== "recording") return;
    session = transitionCaptureSession(existing, "pause", now);
  }
  await saveCaptureSession(chrome.storage.local, session);
}

async function storeCaptureObservation(observation: CaptureObservation, tabId: number, frameId: number, senderUrl: URL): Promise<void> {
  if (observation.origin !== senderUrl.origin || observation.path !== senderUrl.pathname) return;
  const session = await loadCaptureSession(chrome.storage.local);
  if (!session || session.status !== "recording" || !session.approvedOrigins.includes(senderUrl.origin)) return;
  const candidate: RecordedAction = { schemaVersion: 1, id: crypto.randomUUID(), sequence: session.actions.length, ...observation, tabId, frameId };
  const valid = validateContract<RecordedAction>("RecordedAction", candidate);
  if (!valid.ok) return;
  const updated = appendCaptureAction(session, valid.value);
  await saveCaptureSession(chrome.storage.local, updated);
  if (updated.actions.length > 0 && updated.actions.length % 20 === 0) await synchronizeAndStore(updated, false);
}

async function recordBrowserEvent(eventKind: RecordedAction["eventKind"], tabId?: number): Promise<void> {
  const session = await loadCaptureSession(chrome.storage.local);
  if (!session || session.status !== "recording") return;
  const previous = session.actions.at(-1);
  const origin = previous?.origin ?? session.approvedOrigins[0];
  if (!origin) return;
  const path = previous?.path ?? "/";
  const action: RecordedAction = { schemaVersion: 1, id: crypto.randomUUID(), sequence: session.actions.length, occurredAt: new Date().toISOString(), origin, path, eventKind, ...(tabId === undefined ? {} : { tabId }), ...(previous?.after ? { before: previous.after } : {}) };
  const valid = validateContract<RecordedAction>("RecordedAction", action);
  if (valid.ok) await saveCaptureSession(chrome.storage.local, appendCaptureAction(session, valid.value));
}

async function synchronizeStoredCapture(final: boolean): Promise<CaptureSession | undefined> {
  const session = await loadCaptureSession(chrome.storage.local);
  if (!session || session.status === "discarded" || session.status === "finalized" || (final && session.status !== "stopped")) return session;
  return synchronizeAndStore(session, final);
}

async function synchronizeAndStore(session: CaptureSession, final: boolean): Promise<CaptureSession> {
  const stored = await chrome.storage.local.get("doonce.captureToken");
  const token = typeof stored["doonce.captureToken"] === "string" ? stored["doonce.captureToken"] : undefined;
  const updated = await synchronizeCaptureSession(session, createHttpCaptureTransport("http://127.0.0.1:4000", token), final);
  await saveCaptureSession(chrome.storage.local, updated);
  return updated;
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isRecord(message) || !["doonce.capture-stop", "doonce.capture-discard", "doonce.capture-sync", "doonce.capture-finalize", "doonce.capture-session"].includes(String(message.type))) return;
  void handleCaptureCommand(String(message.type)).then((session) => sendResponse({ session }), () => sendResponse({ session: undefined }));
  return true;
});

async function handleCaptureCommand(type: string): Promise<CaptureSession | undefined> {
  const session = await loadCaptureSession(chrome.storage.local);
  if (type === "doonce.capture-session") return session;
  if (!session) return undefined;
  if (type === "doonce.capture-discard") { await discardCaptureSession(chrome.storage.local); return undefined; }
  if (type === "doonce.capture-stop") {
    const stopped = session.status === "recording" || session.status === "paused" ? transitionCaptureSession(session, "stop") : session;
    await saveCaptureSession(chrome.storage.local, stopped);
    return stopped;
  }
  if (type === "doonce.capture-sync") return synchronizeAndStore(session, false);
  if (type === "doonce.capture-finalize") return synchronizeAndStore(session, true);
  return session;
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

function isCaptureObservationMessage(value: unknown): value is { type: "doonce.capture-observation"; observation: CaptureObservation } {
  if (!isRecord(value) || value.type !== "doonce.capture-observation" || !isRecord(value.observation)) return false;
  return typeof value.observation.occurredAt === "string" && typeof value.observation.origin === "string" && typeof value.observation.path === "string" && typeof value.observation.eventKind === "string";
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

let pollingRun = false;

async function pollForWorkflowRun(): Promise<void> {
  if (pollingRun) return;
  pollingRun = true;
  try {
    const stored = await chrome.storage.local.get("doonce.captureToken");
    const token = stored["doonce.captureToken"];
    if (typeof token !== "string") return;
    const transport = createHttpRunTransport("http://127.0.0.1:4000", token, chrome.runtime.getManifest().version);
    const lease = await transport.claim();
    if (!lease) return;
    const checkpointKey = `doonce.run.${lease.run.id}.checkpoint`;
    let cancellationRequested = false;
    let leaseValid = true;
    const heartbeat = async () => {
      try {
        const run = await transport.heartbeat(lease.run.id, lease.leaseToken);
        leaseValid = Boolean(run);
        cancellationRequested = !run || run.cancelRequested;
      } catch { leaseValid = false; cancellationRequested = true; }
    };
    const heartbeatTimer = globalThis.setInterval(() => { void heartbeat(); }, 15_000);
    let result: ProtocolRunResult;
    try {
      result = await executeWorkflow(lease.request, lease.workflow, new ChromeExecutorAdapter(lease.workflow.allowedDomains), {
        ...(lease.checkpoint ? { checkpoint: lease.checkpoint } : {}),
        isCancellationRequested: () => cancellationRequested || !leaseValid,
        onCheckpoint: async (checkpoint) => {
          await chrome.storage.session.set({ [checkpointKey]: checkpoint });
          if (!await transport.checkpoint(lease.run.id, lease.leaseToken, checkpoint)) { leaseValid = false; cancellationRequested = true; }
        },
      });
    } catch {
      const now = new Date().toISOString();
      result = { schemaVersion: 1, format: "doonce.run-result.v1", runId: lease.request.runId, workflowId: lease.request.workflowId, workflowVersion: lease.request.workflowVersion, status: "paused", reasonCode: "extension.attention-required", stepResults: lease.checkpoint?.stepResults ?? [], startedAt: now, finishedAt: now };
    } finally { globalThis.clearInterval(heartbeatTimer); }
    if (leaseValid) await transport.finish(lease.run.id, lease.leaseToken, result);
    await chrome.storage.session.remove(checkpointKey);
    void notifyWorkflowRun(result);
  } finally { pollingRun = false; }
}

async function notifyWorkflowRun(result: ProtocolRunResult): Promise<void> {
  const normalized: RunResult = result.status === "completed" ? { outcome: "completed" } : { outcome: "paused", reasonCode: result.reasonCode === "wait.timeout" ? "slow-network" : result.reasonCode?.startsWith("locator.") ? "changed-page" : "unknown", reason: `Workflow ${result.status}: ${result.reasonCode ?? "no reason supplied"}.` };
  await notifyDemoRun(normalized);
}
