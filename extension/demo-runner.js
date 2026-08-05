/* global chrome */

async function runVerifiedDemoDownload() {
  const fixture = document.querySelector('[data-doonce-demo-report="weekly-sales"]');
  const button = fixture?.querySelector('[data-doonce-safe-action="download"]');
  const status = fixture?.querySelector("#demo-run-status");
  if (!(button instanceof HTMLButtonElement) || button.disabled || !status) {
    return { outcome: "paused", reason: "The expected safe download control is unavailable." };
  }

  button.click();
  await new Promise((resolve) => setTimeout(resolve, 75));
  if (!status.textContent?.includes("Download started")) {
    return { outcome: "paused", reason: "The download confirmation did not appear." };
  }
  return { outcome: "completed" };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "doonce.run-demo-download") return;
  void runVerifiedDemoDownload().then(sendResponse, () => sendResponse({ outcome: "paused", reason: "The demo run could not be verified." }));
  return true;
});
