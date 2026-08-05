/* global chrome */

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get("doonce.consentedOrigins");
  if (!Array.isArray(stored["doonce.consentedOrigins"])) {
    await chrome.storage.local.set({ "doonce.consentedOrigins": [] });
  }
});
