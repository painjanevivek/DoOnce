import type { AssertionResult, WorkflowActionKind, WorkflowAssertion, WorkflowStep } from "../../../contracts/protocol";
import type { ActionExecutionResult, ExecutionContext, ExecutorAdapter, ExecutorCapabilities } from "./executor-adapter";
import type { DownloadObservation } from "./assertion-evaluator";

const actions: WorkflowActionKind[] = ["navigate", "wait", "read", "select", "type", "download", "compare", "branch", "ask-approval", "stop"];

export class ChromeExecutorAdapter implements ExecutorAdapter {
  private tabId: number | undefined;
  private cancelled = false;
  private readonly downloads: DownloadObservation[] = [];
  public constructor(private readonly allowedDomains: readonly string[]) {}
  public capabilities(): ExecutorCapabilities { return { executor: "extension", actions, maxSteps: 500, supportsDownloads: true, features: ["workflow-spec-v1", "semantic-locators", "event-waits", "checkpoints", "navigation-reinjection"] }; }
  public async prepare(): Promise<void> {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!active?.id || !isAllowedExtensionUrl(active.url, this.allowedDomains)) throw new TypeError("Open an allowed workflow page before running.");
    this.tabId = active.id;
  }
  public async cancel(): Promise<void> { this.cancelled = true; }
  public async close(): Promise<void> {}
  public async verify(assertions: readonly WorkflowAssertion[], context: ExecutionContext): Promise<AssertionResult[]> {
    const tabId = this.tabId;
    if (!tabId) return assertions.map((assertion) => ({ schemaVersion: 1, assertionId: assertion.id, status: "failed", reasonCode: "tab.not-owned", verifiedAt: new Date().toISOString() }));
    const tab = await chrome.tabs.get(tabId);
    if (!isAllowedExtensionUrl(tab.url, this.allowedDomains)) return assertions.map((assertion) => ({ schemaVersion: 1, assertionId: assertion.id, status: "failed", reasonCode: "navigation.unexpected-domain", verifiedAt: new Date().toISOString() }));
    try { return await chrome.tabs.sendMessage(tabId, { type: "doonce.verify-assertions", assertions, context, downloads: this.downloads }); }
    catch {
      await chrome.scripting.executeScript({ target: { tabId, allFrames: false }, files: ["dist/content-runner.js"] });
      try { return await chrome.tabs.sendMessage(tabId, { type: "doonce.verify-assertions", assertions, context, downloads: this.downloads }); }
      catch { return assertions.map((assertion) => ({ schemaVersion: 1, assertionId: assertion.id, status: "failed", reasonCode: "content-script.unavailable", verifiedAt: new Date().toISOString() })); }
    }
  }
  public async execute(step: WorkflowStep, context: ExecutionContext): Promise<ActionExecutionResult> {
    if (this.cancelled) return { status: "paused", reasonCode: "run.cancelled" };
    const tabId = this.tabId;
    if (!tabId) return { status: "failed", reasonCode: "tab.not-owned" };
    if (step.action === "navigate") return this.navigate(tabId, step.target.domain, step.target.path);
    const tab = await chrome.tabs.get(tabId);
    if (!isAllowedExtensionUrl(tab.url, this.allowedDomains) || ("target" in step && tab.url && new URL(tab.url).hostname !== step.target.domain)) {
      return { status: "paused", reasonCode: "navigation.unexpected-domain" };
    }
    if (step.action === "download") return this.download(tabId, step, context);
    return this.executeInTab(tabId, step, context);
  }

  private async executeInTab(tabId: number, step: WorkflowStep, context: ExecutionContext): Promise<ActionExecutionResult> {
    try {
      return await chrome.tabs.sendMessage(tabId, { type: "doonce.execute-step", step, context });
    } catch {
      await chrome.scripting.executeScript({ target: { tabId, allFrames: false }, files: ["dist/content-runner.js"] });
      try { return await chrome.tabs.sendMessage(tabId, { type: "doonce.execute-step", step, context }); }
      catch { return { status: "paused", reasonCode: "content-script.unavailable", retryable: true }; }
    }
  }

  private async download(tabId: number, step: Extract<WorkflowStep, { action: "download" }>, context: ExecutionContext): Promise<ActionExecutionResult> {
    const event = waitForDownload(15_000, () => this.cancelled, step.target.domain);
    const action = await this.executeInTab(tabId, step, context);
    if (action.status !== "verified") return action;
    const item = await event;
    if (!item) return { ...action, status: "paused", reasonCode: this.cancelled ? "run.cancelled" : "download.not-observed", retryable: !this.cancelled };
    const downloadId = item.id;
    const bytes = item.fileSize && item.fileSize > 0 ? item.fileSize : item.totalBytes;
    if (bytes <= 0 || bytes > 100 * 1024 * 1024) {
      await chrome.downloads.cancel(downloadId).catch(() => undefined);
      await chrome.downloads.erase({ id: downloadId }).catch(() => undefined);
      return { ...action, status: "paused", reasonCode: "download.size-unverified" };
    }
    this.downloads.push({ fileName: item?.filename?.split(/[\\/]/).at(-1) ?? `download-${downloadId}`, bytes: item?.fileSize && item.fileSize > 0 ? item.fileSize : item?.totalBytes ?? 0, ...(item?.mime ? { contentType: item.mime } : {}), evidenceRefs: [`download:${downloadId}`] });
    return { ...action, evidenceRefs: [...(action.evidenceRefs ?? []), `download:${downloadId}`] };
  }

  private async navigate(tabId: number, domain: string, path: string): Promise<ActionExecutionResult> {
    if (!this.allowedDomains.includes(domain)) return { status: "failed", reasonCode: "navigation.domain-not-allowed" };
    const current = await chrome.tabs.get(tabId);
    const protocol = ["localhost", "127.0.0.1"].includes(domain) && current.url ? new URL(current.url).protocol : "https:";
    const url = new URL(path, `${protocol}//${domain}`).href;
    await chrome.tabs.update(tabId, { url });
    const loaded = await waitForTabComplete(tabId, 30_000, () => this.cancelled);
    if (!loaded) return { status: "paused", reasonCode: this.cancelled ? "run.cancelled" : "navigation.timeout", retryable: !this.cancelled };
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || new URL(tab.url).hostname !== domain) return { status: "paused", reasonCode: "navigation.unexpected-domain" };
    return { status: "verified", evidenceRefs: [`navigation:${tabId}:${Date.now()}`] };
  }
}

function waitForDownload(timeoutMs: number, cancelled: () => boolean, expectedDomain: string): Promise<chrome.downloads.DownloadItem | undefined> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value?: chrome.downloads.DownloadItem) => { if (settled) return; settled = true; clearTimeout(timer); chrome.downloads.onCreated.removeListener(listener); resolve(value); };
    const listener = (item: chrome.downloads.DownloadItem) => { if (downloadMatchesDomain(item, expectedDomain)) finish(cancelled() ? undefined : item); };
    const timer = setTimeout(() => finish(), timeoutMs);
    chrome.downloads.onCreated.addListener(listener);
  });
}

export function isAllowedExtensionUrl(value: string | undefined, allowedDomains: readonly string[]): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return allowedDomains.includes(url.hostname)
      && (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)));
  } catch {
    return false;
  }
}

export function downloadMatchesDomain(item: Pick<chrome.downloads.DownloadItem, "url" | "finalUrl" | "referrer">, expectedDomain: string): boolean {
  return [item.url, item.finalUrl, item.referrer].some((value) => {
    if (!value) return false;
    try { return new URL(value).hostname === expectedDomain; } catch { return false; }
  });
}

function waitForTabComplete(tabId: number, timeoutMs: number, cancelled: () => boolean): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => { if (settled) return; settled = true; clearTimeout(timer); chrome.tabs.onUpdated.removeListener(listener); resolve(value); };
    const listener = (updatedTabId: number, info: { status?: string }) => { if (updatedTabId === tabId && info.status === "complete") finish(!cancelled()); };
    const timer = setTimeout(() => finish(false), timeoutMs);
    chrome.tabs.onUpdated.addListener(listener);
  });
}
