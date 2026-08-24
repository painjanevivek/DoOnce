import type { ElementEvidence, PageState, RecordedAction } from "../../contracts/protocol";
import { createElementEvidence, fingerprint, normalizeUrlPattern } from "./capture-evidence";
import { normalizeRecordedPath } from "./capture-eligibility";
import { isProtectedCaptureTarget } from "./capture-target-policy";

export type CaptureObservation = Omit<RecordedAction, "schemaVersion" | "id" | "sequence" | "tabId" | "frameId">;

let recording = false;
let navigationId = crypto.randomUUID();
const pendingInputs = new Map<Element, number>();

function observeEvent(event: Event): void {
  if (!recording) return;
  const target = event.composedPath().find((item): item is HTMLElement => item instanceof HTMLElement);
  if (!target || isHiddenControl(target) || isProtectedCaptureTarget({
    isContentEditable: target.isContentEditable,
    tagName: target.tagName,
    ...(target instanceof HTMLInputElement ? { inputType: target.type, autocomplete: target.autocomplete, name: target.name, id: target.id } : {}),
  })) return;
  const eventKind = semanticEventKind(event.type, target);
  if (!eventKind) return;
  if (eventKind === "input") {
    const existing = pendingInputs.get(target);
    if (existing !== undefined) window.clearTimeout(existing);
    pendingInputs.set(target, window.setTimeout(() => { pendingInputs.delete(target); void sendElementObservation(target, eventKind); }, 450));
    return;
  }
  const pending = pendingInputs.get(target);
  if (pending !== undefined) { window.clearTimeout(pending); pendingInputs.delete(target); }
  void sendElementObservation(target, eventKind);
}

async function sendElementObservation(target: HTMLElement, eventKind: RecordedAction["eventKind"]): Promise<void> {
  if (window !== window.top) return;
  const path = normalizeRecordedPath(location.pathname);
  const pattern = normalizeUrlPattern(location.href);
  if (!recording || !path || !pattern) return;
  const before = pageState(pattern, path);
  const evidence = elementEvidence(target);
  if (!evidence) return;
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  const observation: CaptureObservation = {
    occurredAt: new Date().toISOString(),
    origin: location.origin,
    path,
    eventKind,
    locator: evidence.locator,
    target: evidence,
    before,
    after: pageState(normalizeUrlPattern(location.href) ?? pattern, normalizeRecordedPath(location.pathname) ?? path),
    ...(inferActionHint(target) ? { actionHint: "download" } : {}),
  };
  void chrome.runtime.sendMessage({ type: "doonce.capture-observation", observation });
}

function sendNavigation(eventKind: RecordedAction["eventKind"]): void {
  if (!recording) return;
  const path = normalizeRecordedPath(location.pathname);
  const pattern = normalizeUrlPattern(location.href);
  if (!path || !pattern) return;
  navigationId = crypto.randomUUID();
  const state = pageState(pattern, path);
  const observation: CaptureObservation = { occurredAt: state.capturedAt, origin: location.origin, path, eventKind, after: state };
  void chrome.runtime.sendMessage({ type: "doonce.capture-observation", observation });
}

function pageState(urlPattern: string, path: string): PageState {
  const structure = Array.from(document.querySelectorAll("main,form,nav,table,[role]")).slice(0, 80).map((element) => `${element.tagName}:${element.getAttribute("role") ?? ""}`).join("|");
  return {
    capturedAt: new Date().toISOString(), origin: location.origin, path, urlPattern, navigationId,
    ...(structure ? { domFingerprint: fingerprint(structure) } : {}),
  };
}

function elementEvidence(target: HTMLElement): ElementEvidence | undefined {
  const rect = target.getBoundingClientRect();
  const visibleWidth = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
  const visibleHeight = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
  const testId = target.getAttribute("data-doonce-capture-id") ?? target.getAttribute("data-testid") ?? undefined;
  const stableId = target.id && !/^[0-9a-f]{8,}$/i.test(target.id) && !/pass|otp|card|token|secret/i.test(target.id) ? target.id : undefined;
  if (!testId && !stableId) return undefined;
  return createElementEvidence({
    ...(testId ? { testId } : {}), ...(stableId ? { id: stableId } : {}),
    tagName: target.tagName, ...(target instanceof HTMLInputElement ? { inputType: target.type } : {}),
    framePath: [],
    viewportWidth: innerWidth, viewportHeight: innerHeight, visibleArea: visibleWidth * visibleHeight, elementArea: Math.max(0, rect.width * rect.height),
  });
}

function semanticEventKind(type: string, target: HTMLElement): RecordedAction["eventKind"] | undefined {
  if (type === "submit") return "submit";
  if (type === "click") return "click";
  if (type !== "input" && type !== "change") return undefined;
  if (target instanceof HTMLSelectElement) return "select";
  if (target instanceof HTMLInputElement && (target.type === "checkbox" || target.type === "radio")) return "toggle";
  return type;
}

function installNavigationObservers(): void {
  const pushState = history.pushState.bind(history);
  const replaceState = history.replaceState.bind(history);
  history.pushState = (...arguments_) => { pushState(...arguments_); queueMicrotask(() => sendNavigation("navigate")); };
  history.replaceState = (...arguments_) => { replaceState(...arguments_); queueMicrotask(() => sendNavigation("redirect")); };
  addEventListener("popstate", () => sendNavigation("navigate"));
  addEventListener("hashchange", () => sendNavigation("navigate"));
  addEventListener("pageshow", (event) => sendNavigation(event.persisted ? "navigate" : "reload"));
}

document.addEventListener("click", observeEvent, true);
document.addEventListener("change", observeEvent, true);
document.addEventListener("input", observeEvent, true);
document.addEventListener("submit", observeEvent, true);
installNavigationObservers();

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isRecord(message)) return;
  if (message.type === "doonce.start-capture") { recording = true; sendNavigation("navigate"); }
  if (message.type === "doonce.pause-capture" || message.type === "doonce.stop-capture") {
    recording = false;
    for (const timeout of pendingInputs.values()) window.clearTimeout(timeout);
    pendingInputs.clear();
  }
  if (message.type === "doonce.capture-status") sendResponse({ recording });
});


function inferActionHint(target: HTMLElement): boolean {
  return target.getAttribute("data-doonce-safe-action") === "download" || (target instanceof HTMLAnchorElement && target.hasAttribute("download"));
}

function isHiddenControl(target: HTMLElement): boolean { return target instanceof HTMLInputElement && target.type === "hidden"; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
