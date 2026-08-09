import type { WorkflowActionKind, WorkflowStep } from "../../../contracts/protocol";
import type { ActionExecutionResult, ExecutionContext, ExecutorAdapter, ExecutorCapabilities } from "./executor-adapter";

const actions: WorkflowActionKind[] = ["navigate", "wait", "read", "select", "type", "download", "compare", "branch", "ask-approval", "stop"];

export class ChromeExecutorAdapter implements ExecutorAdapter {
  private tabId: number | undefined;
  private cancelled = false;
  public constructor(private readonly allowedDomains: readonly string[]) {}
  public capabilities(): ExecutorCapabilities { return { executor: "extension", actions, maxSteps: 500, supportsDownloads: true, features: ["workflow-spec-v1", "semantic-locators", "event-waits", "checkpoints", "navigation-reinjection"] }; }
  public async prepare(): Promise<void> {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!active?.id || !active.url || !this.allowedDomains.includes(new URL(active.url).hostname)) throw new TypeError("Open an allowed workflow page before running.");
    this.tabId = active.id;
  }
  public async cancel(): Promise<void> { this.cancelled = true; }
  public async close(): Promise<void> {}
  public async execute(step: WorkflowStep, context: ExecutionContext): Promise<ActionExecutionResult> {
    if (this.cancelled) return { status: "paused", reasonCode: "run.cancelled" };
    const tabId = this.tabId;
    if (!tabId) return { status: "failed", reasonCode: "tab.not-owned" };
    if (step.action === "navigate") return this.navigate(tabId, step.target.domain, step.target.path);
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

  private async download(tabId: number, step: WorkflowStep, context: ExecutionContext): Promise<ActionExecutionResult> {
    const event = waitForDownload(15_000, () => this.cancelled);
    const action = await this.executeInTab(tabId, step, context);
    if (action.status !== "verified") return action;
    const downloadId = await event;
    return downloadId === undefined ? { ...action, status: "paused", reasonCode: this.cancelled ? "run.cancelled" : "download.not-observed", retryable: !this.cancelled } : { ...action, evidenceRefs: [...(action.evidenceRefs ?? []), `download:${downloadId}`] };
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

function waitForDownload(timeoutMs: number, cancelled: () => boolean): Promise<number | undefined> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value?: number) => { if (settled) return; settled = true; clearTimeout(timer); chrome.downloads.onCreated.removeListener(listener); resolve(value); };
    const listener = (item: chrome.downloads.DownloadItem) => finish(cancelled() ? undefined : item.id);
    const timer = setTimeout(() => finish(), timeoutMs);
    chrome.downloads.onCreated.addListener(listener);
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
