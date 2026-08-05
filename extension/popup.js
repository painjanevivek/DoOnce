/* global chrome */

const consentButton = document.querySelector("#consent");
const recordingButton = document.querySelector("#recording");
const runDemoButton = document.querySelector("#run-demo");
const revokeButton = document.querySelector("#revoke");
const exportButton = document.querySelector("#export");
const originElement = document.querySelector("#origin");
const statusElement = document.querySelector("#status");
const captureCountElement = document.querySelector("#capture-count");
const runCountElement = document.querySelector("#run-count");
const lastRunElement = document.querySelector("#last-run");
let currentOrigin;
let currentTab;
let recording = false;

function recordableOrigin(url) {
  const parsed = new URL(url);
  return parsed.protocol === "https:" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
}

function displayStatus(message) {
  statusElement.textContent = message;
}

async function updateCaptureCount() {
  const stored = await chrome.storage.local.get("doonce.capturedSummaries");
  const summaries = (stored["doonce.capturedSummaries"] ?? []).filter((summary) => summary.origin === currentOrigin);
  exportButton.disabled = summaries.length === 0;
  captureCountElement.textContent = summaries.length ? `${summaries.length} value-free local event${summaries.length === 1 ? "" : "s"} ready for review.` : "No local events ready for review.";
}

async function updateRunCount() {
  const stored = await chrome.storage.local.get("doonce.demoRunReceipts");
  const rawReceipts = stored["doonce.demoRunReceipts"];
  const receipts = (Array.isArray(rawReceipts) ? rawReceipts : []).filter((receipt) => receipt && typeof receipt === "object" && receipt.origin === currentOrigin);
  runCountElement.textContent = receipts.length ? `${receipts.length} local demo receipt${receipts.length === 1 ? "" : "s"} ready for review.` : "No local demo run receipts.";
  lastRunElement.textContent = DoOnceReceiptView.describeReceipt(receipts.at(-1));
}

async function isCurrentTabRecording(tab) {
  if (!tab?.id) return false;
  try {
    return (await chrome.tabs.sendMessage(tab.id, { type: "doonce.capture-status" }))?.recording === true;
  } catch {
    return false;
  }
}

async function loadCurrentOrigin() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  if (!tab?.url || !recordableOrigin(tab.url)) {
    originElement.textContent = "Open an HTTPS website or the local DoOnce demo to continue.";
    displayStatus("No site has been approved.");
    return;
  }

  currentOrigin = new URL(tab.url).origin;
  originElement.textContent = currentOrigin;
  const stored = await chrome.storage.local.get(["doonce.consentedOrigins", "doonce.recordingOrigins"]);
  const allowedOrigins = stored["doonce.consentedOrigins"] ?? [];
  recording = DoOnceRecordingState.isRecording(stored["doonce.recordingOrigins"], currentOrigin) && await isCurrentTabRecording(tab);
  consentButton.disabled = false;
  recordingButton.disabled = !allowedOrigins.includes(currentOrigin);
  recordingButton.textContent = recording ? "Pause recording" : "Resume recording";
  runDemoButton.disabled = !DoOnceRunPolicy.canRunDemo(tab.url, allowedOrigins);
  revokeButton.disabled = !allowedOrigins.includes(currentOrigin);
  displayStatus(allowedOrigins.includes(currentOrigin) ? (recording ? "This site is approved and recording is active for this tab." : "This site is approved; recording is paused.") : "This site is not approved.");
  await updateCaptureCount();
  await updateRunCount();
}

consentButton.addEventListener("click", async () => {
  if (!currentOrigin) return;
  const stored = await chrome.storage.local.get("doonce.consentedOrigins");
  const allowedOrigins = new Set(stored["doonce.consentedOrigins"] ?? []);
  allowedOrigins.add(currentOrigin);
  await chrome.storage.local.set({ "doonce.consentedOrigins": [...allowedOrigins] });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const response = tab?.id ? await chrome.runtime.sendMessage({ type: "doonce.start-capture", origin: currentOrigin, tabId: tab.id }) : undefined;
  recording = response?.updated === true;
  recordingButton.disabled = !recording;
  recordingButton.textContent = recording ? "Pause recording" : "Resume recording";
  runDemoButton.disabled = !DoOnceRunPolicy.canRunDemo(currentTab?.url, [currentOrigin]);
  revokeButton.disabled = false;
  displayStatus(recording ? "Consent saved locally. Safe, value-free capture is active for this tab only." : "Consent was saved, but recording could not start for this tab.");
  await updateCaptureCount();
});

runDemoButton.addEventListener("click", async () => {
  if (!currentOrigin || !currentTab?.id) return;
  runDemoButton.disabled = true;
  displayStatus("Running the verified local download. DoOnce will pause if the expected confirmation is absent.");
  const result = await chrome.runtime.sendMessage({ type: "doonce.run-demo-download", origin: currentOrigin, tabId: currentTab.id });
  await updateRunCount();
  displayStatus(result?.outcome === "completed" ? "Verified local demo download completed. A redacted local receipt was saved." : `Demo run paused: ${result?.reason ?? "verification failed"}`);
  runDemoButton.disabled = !DoOnceRunPolicy.canRunDemo(currentTab.url, [currentOrigin]);
});

recordingButton.addEventListener("click", async () => {
  if (!currentOrigin) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const enabled = !recording;
  const response = await chrome.runtime.sendMessage({ type: "doonce.set-recording", origin: currentOrigin, tabId: tab.id, enabled });
  if (response?.updated !== true) {
    displayStatus("Recording state could not be changed for this tab.");
    return;
  }
  recording = enabled;
  recordingButton.textContent = recording ? "Pause recording" : "Resume recording";
  displayStatus(recording ? "Recording resumed for this tab. Sensitive values remain excluded." : "Recording paused. Nothing new will be captured until you resume.");
});

revokeButton.addEventListener("click", async () => {
  if (!currentOrigin) return;
  const stored = await chrome.storage.local.get("doonce.consentedOrigins");
  const allowedOrigins = (stored["doonce.consentedOrigins"] ?? []).filter((origin) => origin !== currentOrigin);
  const [captures, recordingOrigins] = await Promise.all([chrome.storage.local.get("doonce.capturedSummaries"), chrome.storage.local.get("doonce.recordingOrigins")]);
  await chrome.storage.local.set({
    "doonce.consentedOrigins": allowedOrigins,
    "doonce.capturedSummaries": (captures["doonce.capturedSummaries"] ?? []).filter((summary) => summary.origin !== currentOrigin),
    "doonce.recordingOrigins": DoOnceRecordingState.setRecording(recordingOrigins["doonce.recordingOrigins"], currentOrigin, false),
  });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) await chrome.tabs.sendMessage(tab.id, { type: "doonce.stop-capture" }).catch(() => undefined);
  revokeButton.disabled = true;
  recording = false;
  recordingButton.disabled = true;
  recordingButton.textContent = "Pause recording";
  runDemoButton.disabled = true;
  displayStatus("Consent removed. Capture is off for this site.");
  await updateCaptureCount();
});

exportButton.addEventListener("click", async () => {
  if (!currentOrigin) return;
  const stored = await chrome.storage.local.get("doonce.capturedSummaries");
  const summaries = (stored["doonce.capturedSummaries"] ?? []).filter((summary) => summary.origin === currentOrigin);
  const blob = new Blob([JSON.stringify({ format: "doonce.safe-capture.v1", summaries }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "doonce-safe-capture.json";
  link.click();
  URL.revokeObjectURL(url);
  displayStatus("Local review file downloaded. Nothing was sent to DoOnce.");
});

void loadCurrentOrigin().catch(() => {
  originElement.textContent = "DoOnce could not read the current tab.";
  displayStatus("No site has been approved.");
});
