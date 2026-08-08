import { createCaptureExport, type RecordedActionSummary } from "./capture-export";
import { describePauseReason, describeReceipt, isReceipt, type LocalReceipt } from "./receipt-view";
import { isRecording, removeOriginData, setRecording } from "./recording-state";
import { canRunDemo, canStartDemoRun, isConsentableWebOrigin } from "./run-eligibility";
import { compileRecordedActions } from "./workflow-compiler";

const consentButton = element<HTMLButtonElement>("#consent");
const recordingButton = element<HTMLButtonElement>("#recording");
const runDemoButton = element<HTMLButtonElement>("#run-demo");
const runApprovalInput = element<HTMLInputElement>("#run-approval");
const exportReceiptsButton = element<HTMLButtonElement>("#export-receipts");
const revokeButton = element<HTMLButtonElement>("#revoke");
const exportButton = element<HTMLButtonElement>("#export");
const originElement = element<HTMLElement>("#origin");
const statusElement = element<HTMLElement>("#status");
const captureCountElement = element<HTMLElement>("#capture-count");
const runCountElement = element<HTMLElement>("#run-count");
const lastRunElement = element<HTMLElement>("#last-run");
let currentOrigin: string | undefined;
let currentTab: chrome.tabs.Tab | undefined;
let recording = false;

function displayStatus(message: string): void {
  statusElement.textContent = message;
}

function updateDemoRunAvailability(allowedOrigins: string[]): void {
  const available = Boolean(currentTab?.url && canRunDemo(currentTab.url, allowedOrigins));
  runApprovalInput.disabled = !available;
  if (!available) runApprovalInput.checked = false;
  runDemoButton.disabled = !canStartDemoRun(currentTab?.url, allowedOrigins, runApprovalInput.checked);
}

async function updateCaptureCount(): Promise<void> {
  const stored = await chrome.storage.local.get("doonce.capturedSummaries");
  const summaries = actionSummaries(stored["doonce.capturedSummaries"]).filter((summary) => summary.origin === currentOrigin);
  exportButton.disabled = summaries.length === 0;
  captureCountElement.textContent = summaries.length ? `${summaries.length} value-free local event${summaries.length === 1 ? "" : "s"} ready for review.` : "No local events ready for review.";
}

async function updateRunCount(): Promise<void> {
  const stored = await chrome.storage.local.get("doonce.demoRunReceipts");
  const receipts = receiptList(stored["doonce.demoRunReceipts"]).filter((receipt) => receipt.origin === currentOrigin);
  exportReceiptsButton.disabled = receipts.length === 0;
  runCountElement.textContent = receipts.length ? `${receipts.length} local demo receipt${receipts.length === 1 ? "" : "s"} ready for review.` : "No local demo run receipts.";
  lastRunElement.textContent = describeReceipt(receipts.at(-1));
}

async function isCurrentTabRecording(tab: chrome.tabs.Tab): Promise<boolean> {
  if (!tab.id) return false;
  try {
    const response: unknown = await chrome.tabs.sendMessage(tab.id, { type: "doonce.capture-status" });
    return isRecord(response) && response.recording === true;
  } catch {
    return false;
  }
}

async function loadCurrentOrigin(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  if (!tab?.url || !isConsentableWebOrigin(tab.url)) {
    originElement.textContent = "Open an HTTPS website or the local DoOnce demo to continue.";
    displayStatus("No site has been approved.");
    return;
  }

  currentOrigin = new URL(tab.url).origin;
  originElement.textContent = currentOrigin;
  const stored = await chrome.storage.local.get(["doonce.consentedOrigins", "doonce.recordingOrigins"]);
  const allowedOrigins = stringArray(stored["doonce.consentedOrigins"]);
  recording = isRecording(stored["doonce.recordingOrigins"], currentOrigin) && await isCurrentTabRecording(tab);
  consentButton.disabled = false;
  recordingButton.disabled = !allowedOrigins.includes(currentOrigin);
  recordingButton.textContent = recording ? "Pause recording" : "Resume recording";
  updateDemoRunAvailability(allowedOrigins);
  revokeButton.disabled = !allowedOrigins.includes(currentOrigin);
  displayStatus(allowedOrigins.includes(currentOrigin) ? (recording ? "This site is approved and recording is active for this tab." : "This site is approved; recording is paused.") : "This site is not approved.");
  await Promise.all([updateCaptureCount(), updateRunCount()]);
}

consentButton.addEventListener("click", async () => {
  if (!currentOrigin) return;
  const stored = await chrome.storage.local.get("doonce.consentedOrigins");
  const allowedOrigins = new Set(stringArray(stored["doonce.consentedOrigins"]));
  allowedOrigins.add(currentOrigin);
  await chrome.storage.local.set({ "doonce.consentedOrigins": [...allowedOrigins] });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const response: unknown = tab?.id ? await chrome.runtime.sendMessage({ type: "doonce.start-capture", origin: currentOrigin, tabId: tab.id }) : undefined;
  recording = isRecord(response) && response.updated === true;
  recordingButton.disabled = !recording;
  recordingButton.textContent = recording ? "Pause recording" : "Resume recording";
  updateDemoRunAvailability([currentOrigin]);
  revokeButton.disabled = false;
  displayStatus(recording ? "Site approval saved locally. Value-free capture is active for this tab only." : "Site approval was saved, but recording could not start for this tab.");
  await updateCaptureCount();
});

exportReceiptsButton.addEventListener("click", async () => {
  if (!currentOrigin) return;
  const stored = await chrome.storage.local.get("doonce.demoRunReceipts");
  const receipts = receiptList(stored["doonce.demoRunReceipts"]).filter((receipt) => receipt.origin === currentOrigin);
  if (receipts.length === 0) return displayStatus("No verified local receipt is available to export.");
  downloadJson({ format: "doonce.local-run-receipt.v1", receipts }, "doonce-local-run-receipts.json");
  displayStatus("Local receipts downloaded for dashboard review. Nothing was sent automatically.");
});

runDemoButton.addEventListener("click", async () => {
  if (!currentOrigin || !currentTab?.id) return;
  if (!canStartDemoRun(currentTab.url, [currentOrigin], runApprovalInput.checked)) return displayStatus("Review the local action and check the approval box before running it.");
  runDemoButton.disabled = true;
  runApprovalInput.disabled = true;
  exportReceiptsButton.disabled = true;
  displayStatus("Running the verified local download. DoOnce will pause if the expected confirmation is absent.");
  let result: unknown;
  try {
    result = await chrome.runtime.sendMessage({ type: "doonce.run-demo-download", origin: currentOrigin, tabId: currentTab.id });
  } catch {
    result = { outcome: "paused", reasonCode: "unknown" };
  }
  await updateRunCount();
  displayStatus(isRecord(result) && result.outcome === "completed" ? "Verified local demo download completed. A redacted local receipt was saved." : `Demo run paused: ${describePauseReason(isRecord(result) ? result.reasonCode : "unknown")}`);
  runApprovalInput.checked = false;
  updateDemoRunAvailability([currentOrigin]);
});

runApprovalInput.addEventListener("change", () => updateDemoRunAvailability(currentOrigin ? [currentOrigin] : []));

recordingButton.addEventListener("click", async () => {
  if (!currentOrigin) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const enabled = !recording;
  const response: unknown = await chrome.runtime.sendMessage({ type: "doonce.set-recording", origin: currentOrigin, tabId: tab.id, enabled });
  if (!isRecord(response) || response.updated !== true) return displayStatus("Recording state could not be changed for this tab.");
  recording = enabled;
  recordingButton.textContent = recording ? "Pause recording" : "Resume recording";
  displayStatus(recording ? "Recording resumed for this tab. Protected values remain excluded." : "Recording paused. Nothing new will be captured until you resume.");
});

revokeButton.addEventListener("click", async () => {
  if (!currentOrigin) return;
  const stored = await chrome.storage.local.get("doonce.consentedOrigins");
  const allowedOrigins = stringArray(stored["doonce.consentedOrigins"]).filter((origin) => origin !== currentOrigin);
  const [captures, recordingOrigins, demoRunReceipts] = await Promise.all([chrome.storage.local.get("doonce.capturedSummaries"), chrome.storage.local.get("doonce.recordingOrigins"), chrome.storage.local.get("doonce.demoRunReceipts")]);
  await chrome.storage.local.set({
    "doonce.consentedOrigins": allowedOrigins,
    "doonce.capturedSummaries": removeOriginData(captures["doonce.capturedSummaries"], currentOrigin),
    "doonce.recordingOrigins": setRecording(recordingOrigins["doonce.recordingOrigins"], currentOrigin, false),
    "doonce.demoRunReceipts": removeOriginData(demoRunReceipts["doonce.demoRunReceipts"], currentOrigin),
  });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) await chrome.tabs.sendMessage(tab.id, { type: "doonce.stop-capture" }).catch(() => undefined);
  revokeButton.disabled = true;
  recording = false;
  recordingButton.disabled = true;
  recordingButton.textContent = "Pause recording";
  runDemoButton.disabled = true;
  runApprovalInput.checked = false;
  runApprovalInput.disabled = true;
  displayStatus("Site approval removed. Local captures and run receipts for this site were cleared.");
  await updateCaptureCount();
});

exportButton.addEventListener("click", async () => {
  if (!currentOrigin) return;
  const stored = await chrome.storage.local.get("doonce.capturedSummaries");
  const actions = actionSummaries(stored["doonce.capturedSummaries"]).filter((summary) => summary.origin === currentOrigin);
  if (actions.length === 0) return;
  const compiled = compileRecordedActions(actions);
  downloadJson({ ...createCaptureExport(actions), ...(compiled.ok ? { workflowSpec: compiled.value } : {}) }, "doonce-capture.json");
  displayStatus(compiled.ok ? "Capture review file and workflow draft downloaded. Nothing was sent to DoOnce." : "Capture review file downloaded. Nothing was sent to DoOnce.");
});

void loadCurrentOrigin().catch(() => {
  originElement.textContent = "DoOnce could not read the current tab.";
  displayStatus("No site has been approved.");
});

function downloadJson(value: unknown, filename: string): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function actionSummaries(value: unknown): RecordedActionSummary[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is RecordedActionSummary => isRecord(item)
    && typeof item.origin === "string"
    && typeof item.path === "string"
    && (item.eventKind === "click" || item.eventKind === "change" || item.eventKind === "input")
    && typeof item.selector === "string"
    && (item.actionHint === undefined || item.actionHint === "download"));
}

function receiptList(value: unknown): LocalReceipt[] {
  return Array.isArray(value) ? value.filter(isReceipt) : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function element<T extends Element>(selector: string): T {
  const value = document.querySelector<T>(selector);
  if (!value) throw new Error(`Extension popup is missing ${selector}.`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
