import type { CapturedValue, ElementEvidence, PageState, RecordedAction } from "../../contracts/protocol";
import { classifyCapturedValue, createElementEvidence, fingerprint, normalizeUrlPattern } from "./capture-evidence";
import { normalizeRecordedPath } from "./capture-eligibility";

export type CaptureObservation = Omit<RecordedAction, "schemaVersion" | "id" | "sequence" | "tabId" | "frameId">;

let recording = false;
let navigationId = crypto.randomUUID();
const pendingInputs = new Map<Element, number>();

function observeEvent(event: Event): void {
  if (!recording) return;
  const target = event.composedPath().find((item): item is HTMLElement => item instanceof HTMLElement);
  if (!target || isHiddenControl(target)) return;
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
  const path = normalizeRecordedPath(location.pathname);
  const pattern = normalizeUrlPattern(location.href);
  if (!recording || !path || !pattern) return;
  const before = pageState(pattern, path);
  const evidence = elementEvidence(target);
  const value = capturedValue(target);
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  const observation: CaptureObservation = {
    occurredAt: new Date().toISOString(),
    origin: location.origin,
    path,
    eventKind,
    locator: evidence.locator,
    target: evidence,
    ...(value ? { value } : {}),
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
  const titleHint = bounded(document.title, 160);
  return {
    capturedAt: new Date().toISOString(), origin: location.origin, path, urlPattern, navigationId,
    ...(titleHint ? { titleHint } : {}),
    ...(structure ? { domFingerprint: fingerprint(structure) } : {}),
  };
}

function elementEvidence(target: HTMLElement): ElementEvidence {
  const rect = target.getBoundingClientRect();
  const visibleWidth = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
  const visibleHeight = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
  const role = target.getAttribute("role") ?? implicitRole(target);
  const accessibleName = target.getAttribute("aria-label") ?? labelText(target) ?? bounded(target.getAttribute("alt") ?? target.getAttribute("title") ?? target.textContent ?? undefined, 160);
  const testId = target.getAttribute("data-doonce-capture-id") ?? target.getAttribute("data-testid") ?? undefined;
  const textHint = bounded(target.textContent ?? undefined, 160);
  const label = labelText(target);
  const css = cssCandidate(target);
  return createElementEvidence({
    ...(role ? { role } : {}), ...(accessibleName ? { accessibleName } : {}), ...(testId ? { testId } : {}),
    tagName: target.tagName, ...(target instanceof HTMLInputElement ? { inputType: target.type } : {}),
    ...(textHint ? { textHint } : {}),
    ...(target.id ? { id: target.id } : {}), ...(label ? { label } : {}),
    ...(css ? { cssCandidate: css } : {}), framePath: frameAncestry(),
    viewportWidth: innerWidth, viewportHeight: innerHeight, visibleArea: visibleWidth * visibleHeight, elementArea: Math.max(0, rect.width * rect.height),
  });
}

function capturedValue(target: HTMLElement): CapturedValue | undefined {
  if (target instanceof HTMLSelectElement) return classifyCapturedValue(target.value, { name: target.name });
  if (target instanceof HTMLTextAreaElement) return classifyCapturedValue(target.value, { inputType: "text", name: target.name, autocomplete: target.autocomplete });
  if (!(target instanceof HTMLInputElement)) return undefined;
  if (target.type === "checkbox" || target.type === "radio") return { classification: "literal-candidate", placeholder: target.checked ? "{{checked}}" : "{{unchecked}}", length: 0 };
  return classifyCapturedValue(target.value, { inputType: target.type, name: target.name, autocomplete: target.autocomplete, protected: /pass|otp|card|secret|token|pin/i.test(`${target.id} ${target.name} ${target.autocomplete}`) });
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

function frameAncestry(): string[] {
  const result: string[] = [];
  let current: Window = window;
  for (let depth = 0; depth < 8 && current !== current.parent; depth += 1) {
    try {
      const frame = current.frameElement;
      if (!frame) break;
      result.unshift(frame instanceof HTMLElement && frame.id ? `#${frame.id}` : `${frame.tagName.toLowerCase()}[${depth}]`);
      current = current.parent;
    } catch { result.unshift(`cross-origin-frame[${depth}]`); break; }
  }
  return result;
}

function labelText(target: HTMLElement): string | undefined {
  if ((target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) && target.labels?.length) return bounded(Array.from(target.labels).map((label) => label.textContent ?? "").join(" "), 160);
  const labelledBy = target.getAttribute("aria-labelledby");
  return labelledBy ? bounded(labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" "), 160) : undefined;
}

function implicitRole(target: HTMLElement): string | undefined {
  if (target instanceof HTMLButtonElement) return "button";
  if (target instanceof HTMLAnchorElement && target.href) return "link";
  if (target instanceof HTMLSelectElement) return "combobox";
  if (target instanceof HTMLTextAreaElement) return "textbox";
  if (target instanceof HTMLInputElement) return target.type === "checkbox" ? "checkbox" : target.type === "radio" ? "radio" : "textbox";
  return undefined;
}

function cssCandidate(target: HTMLElement): string | undefined {
  if (target.id && !/pass|otp|card|token|secret/i.test(target.id)) return `#${CSS.escape(target.id)}`;
  const captureId = target.getAttribute("data-doonce-capture-id");
  if (captureId && /^[a-z0-9-]{1,64}$/i.test(captureId)) return `[data-doonce-capture-id="${captureId}"]`;
  const name = target.getAttribute("name");
  return name && /^[a-z0-9_.-]{1,64}$/i.test(name) ? `${target.tagName.toLowerCase()}[name="${CSS.escape(name)}"]` : undefined;
}

function inferActionHint(target: HTMLElement): boolean {
  return target.getAttribute("data-doonce-safe-action") === "download" || (target instanceof HTMLAnchorElement && target.hasAttribute("download"));
}

function isHiddenControl(target: HTMLElement): boolean { return target instanceof HTMLInputElement && target.type === "hidden"; }
function bounded(value: string | undefined, maximum: number): string | undefined { const normalized = value?.replace(/\s+/g, " ").trim(); return normalized ? normalized.slice(0, maximum) : undefined; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
