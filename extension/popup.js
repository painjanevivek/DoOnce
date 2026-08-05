/* global chrome */

const consentButton = document.querySelector("#consent");
const revokeButton = document.querySelector("#revoke");
const originElement = document.querySelector("#origin");
const statusElement = document.querySelector("#status");
let currentOrigin;

function recordableOrigin(url) {
  const parsed = new URL(url);
  return parsed.protocol === "https:" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
}

function displayStatus(message) {
  statusElement.textContent = message;
}

async function loadCurrentOrigin() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !recordableOrigin(tab.url)) {
    originElement.textContent = "Open an HTTPS website or the local DoOnce demo to continue.";
    displayStatus("No site has been approved.");
    return;
  }

  currentOrigin = new URL(tab.url).origin;
  originElement.textContent = currentOrigin;
  const stored = await chrome.storage.local.get("doonce.consentedOrigins");
  const allowedOrigins = stored["doonce.consentedOrigins"] ?? [];
  consentButton.disabled = false;
  revokeButton.disabled = !allowedOrigins.includes(currentOrigin);
  displayStatus(allowedOrigins.includes(currentOrigin) ? "This site is approved for future recording." : "This site is not approved.");
}

consentButton.addEventListener("click", async () => {
  if (!currentOrigin) return;
  const stored = await chrome.storage.local.get("doonce.consentedOrigins");
  const allowedOrigins = new Set(stored["doonce.consentedOrigins"] ?? []);
  allowedOrigins.add(currentOrigin);
  await chrome.storage.local.set({ "doonce.consentedOrigins": [...allowedOrigins] });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) await chrome.runtime.sendMessage({ type: "doonce.start-capture", origin: currentOrigin, tabId: tab.id });
  revokeButton.disabled = false;
  displayStatus("Consent saved locally. Safe, value-free capture is active for this tab only.");
});

revokeButton.addEventListener("click", async () => {
  if (!currentOrigin) return;
  const stored = await chrome.storage.local.get("doonce.consentedOrigins");
  const allowedOrigins = (stored["doonce.consentedOrigins"] ?? []).filter((origin) => origin !== currentOrigin);
  const captures = await chrome.storage.local.get("doonce.capturedSummaries");
  await chrome.storage.local.set({
    "doonce.consentedOrigins": allowedOrigins,
    "doonce.capturedSummaries": (captures["doonce.capturedSummaries"] ?? []).filter((summary) => summary.origin !== currentOrigin),
  });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) await chrome.tabs.sendMessage(tab.id, { type: "doonce.stop-capture" }).catch(() => undefined);
  revokeButton.disabled = true;
  displayStatus("Consent removed. Capture is off for this site.");
});

void loadCurrentOrigin().catch(() => {
  originElement.textContent = "DoOnce could not read the current tab.";
  displayStatus("No site has been approved.");
});
