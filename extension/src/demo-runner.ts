import type { RunResult } from "./run-notification";

async function runVerifiedDemoDownload(): Promise<RunResult> {
  const fixture = document.querySelector('[data-doonce-demo-report="weekly-sales"]');
  const button = fixture?.querySelector('[data-doonce-safe-action="download"]');
  const status = fixture?.querySelector("#demo-run-status");
  if (!(button instanceof HTMLButtonElement) || button.disabled || !status) {
    return { outcome: "paused", reasonCode: "changed-page", reason: "The expected download control is unavailable." };
  }

  button.click();
  await new Promise((resolve) => setTimeout(resolve, 75));
  if (!status.textContent?.includes("Download started")) {
    return { outcome: "paused", reasonCode: "slow-network", reason: "The download confirmation did not appear." };
  }
  return { outcome: "completed" };
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isRecord(message) || message.type !== "doonce.run-demo-download") return;
  void runVerifiedDemoDownload().then(sendResponse, () => sendResponse({ outcome: "paused", reasonCode: "unknown", reason: "The demo run could not be verified." } satisfies RunResult));
  return true;
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
