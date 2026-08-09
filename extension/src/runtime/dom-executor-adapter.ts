import type { ElementTarget, LocatorCandidate, PageState, WorkflowActionKind, WorkflowStep } from "../../../contracts/protocol";
import type { ActionExecutionResult, ExecutionContext, ExecutorAdapter, ExecutorCapabilities } from "./executor-adapter";
import { resolveLocator } from "./locator-resolution";

const supportedActions: WorkflowActionKind[] = ["navigate", "wait", "read", "select", "type", "download", "compare", "ask-approval", "stop", "branch"];

export class DomExecutorAdapter implements ExecutorAdapter {
  private cancelled = false;
  public capabilities(): ExecutorCapabilities { return { executor: "extension", actions: supportedActions, maxSteps: 500, supportsDownloads: true, features: ["workflow-spec-v1", "semantic-locators", "event-waits", "checkpoints"] }; }
  public async prepare(): Promise<void> { this.cancelled = false; }
  public async cancel(): Promise<void> { this.cancelled = true; }
  public async close(): Promise<void> {}

  public async execute(step: WorkflowStep, context: ExecutionContext): Promise<ActionExecutionResult> {
    if (this.cancelled) return paused("run.cancelled");
    if (step.action === "navigate") {
      const url = new URL(step.target.path, `${location.protocol}//${step.target.domain}`);
      if (url.hostname !== step.target.domain) return failed("navigation.domain-mismatch");
      if (location.href !== url.href) location.assign(url.href);
      return { status: "verified", observedPage: pageState() };
    }
    if (step.action === "ask-approval") return paused("approval.required");
    if (step.action === "branch" || step.action === "stop") return failed("executor.invalid-control-step");
    const resolved = resolveLocator(step.target.locator, findElements);
    if (resolved.status === "missing") {
      if (step.action === "wait") return this.waitForTarget(step.target, step.timeoutMs);
      return { ...paused("locator.missing"), retryable: true, observedPage: pageState() };
    }
    if (resolved.status === "ambiguous") return { ...paused("locator.ambiguous"), selectedLocator: resolved.candidate, locatorConfidence: resolved.candidate.confidence, observedPage: pageState() };
    const element = resolved.element;
    const locator = { selectedLocator: resolved.candidate, locatorConfidence: resolved.confidence, observedPage: pageState() };
    if (!isVisible(element)) return { ...paused("element.not-visible"), ...locator, retryable: true };
    if (step.action === "wait") return { status: "verified", ...locator };
    if (step.action === "read") return { status: "verified", outputs: { [step.outputName]: readValue(element) }, ...locator };
    if (step.action === "compare") return compare(readValue(element), step.operator, step.expected) ? { status: "verified", ...locator } : { ...paused("assertion.mismatch"), ...locator };
    if (step.action === "type" || step.action === "select") {
      const value = context.variables[step.inputName] ?? context.inputs[step.inputName];
      if (value === undefined) return { ...failed("input.missing"), ...locator };
      if (!setValue(element, value)) return { ...failed("element.not-editable"), ...locator };
      return { status: "verified", ...locator };
    }
    if (step.action === "download") {
      if (!(element instanceof HTMLElement)) return { ...failed("element.not-clickable"), ...locator };
      element.click();
      return { status: "verified", evidenceRefs: [`download-request:${Date.now()}`], ...locator };
    }
    return failed("executor.unsupported-action");
  }

  private async waitForTarget(target: ElementTarget, timeoutMs: number): Promise<ActionExecutionResult> {
    const result = await waitFor(() => resolveLocator(target.locator, findElements), timeoutMs, () => this.cancelled);
    if (result.status === "resolved") return { status: "verified", selectedLocator: result.candidate, locatorConfidence: result.confidence, observedPage: pageState() };
    if (result.status === "ambiguous") return { ...paused("locator.ambiguous"), selectedLocator: result.candidate, locatorConfidence: result.candidate.confidence, observedPage: pageState() };
    return { ...paused(this.cancelled ? "run.cancelled" : "wait.timeout"), retryable: !this.cancelled, observedPage: pageState() };
  }
}

function findElements(candidate: LocatorCandidate): Element[] {
  if (candidate.strategy === "id") { const item = document.getElementById(candidate.value); return item ? [item] : []; }
  if (candidate.strategy === "capture-id") return Array.from(document.querySelectorAll(`[data-doonce-capture-id="${CSS.escape(candidate.value)}"]`));
  if (candidate.strategy === "role") return Array.from(document.querySelectorAll(`[role="${CSS.escape(candidate.value)}"]`));
  if (candidate.strategy === "label") return Array.from(document.querySelectorAll("label")).filter((label) => normalized(label.textContent).includes(normalized(candidate.value))).flatMap((label) => {
    const htmlFor = (label as HTMLLabelElement).htmlFor; const controlled = htmlFor ? document.getElementById(htmlFor) : label.querySelector("input,select,textarea,button"); return controlled ? [controlled] : [];
  });
  return Array.from(document.querySelectorAll("button,a,input,select,textarea,[role]")).filter((element) => normalized(element.textContent ?? element.getAttribute("aria-label")).includes(normalized(candidate.value)));
}

async function waitFor(check: () => ReturnType<typeof resolveLocator<Element>>, timeoutMs: number, cancelled: () => boolean): Promise<ReturnType<typeof resolveLocator<Element>>> {
  const initial = check(); if (initial.status !== "missing" || cancelled()) return initial;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: ReturnType<typeof resolveLocator<Element>>) => { if (settled) return; settled = true; observer.disconnect(); clearTimeout(timer); resolve(value); };
    const observer = new MutationObserver(() => { const value = check(); if (value.status !== "missing" || cancelled()) finish(value); });
    const timer = globalThis.setTimeout(() => finish(check()), Math.min(Math.max(timeoutMs, 100), 60_000));
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  });
}

function pageState(): PageState { return { capturedAt: new Date().toISOString(), origin: location.origin, path: location.pathname, urlPattern: `${location.origin}${location.pathname}`, navigationId: String(performance.timeOrigin), titleHint: document.title.slice(0, 200) }; }
function setValue(element: Element, value: string): boolean { if (element instanceof HTMLSelectElement) { element.value = value; element.dispatchEvent(new Event("change", { bubbles: true })); return element.value === value; } if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) { element.focus(); element.value = value; element.dispatchEvent(new Event("input", { bubbles: true })); element.dispatchEvent(new Event("change", { bubbles: true })); return element.value === value; } return false; }
function readValue(element: Element): string { if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return element.value; return (element.textContent ?? "").trim().slice(0, 10_000); }
function compare(actual: string, operator: "equals" | "contains" | "matches", expected: string): boolean { if (operator === "equals") return actual === expected; if (operator === "contains") return actual.includes(expected); try { return new RegExp(expected).test(actual); } catch { return false; } }
function isVisible(element: Element): boolean { const rect = element.getBoundingClientRect(); const style = getComputedStyle(element); return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none"; }
function normalized(value: string | null): string { return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase(); }
function paused(reasonCode: string): ActionExecutionResult { return { status: "paused", reasonCode }; }
function failed(reasonCode: string): ActionExecutionResult { return { status: "failed", reasonCode }; }
