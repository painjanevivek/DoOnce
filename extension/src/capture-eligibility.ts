export type RecordedEventKind = "click" | "change" | "input";

export interface RecordedEventSummary {
  eventKind: RecordedEventKind;
  selector: string;
  actionHint?: "download";
}

interface FieldMetadata {
  tagName?: string;
  type?: string;
  name?: string;
  id?: string;
  autocomplete?: string;
  getAttribute?(name: string): string | null;
}

const sensitiveName = /(?:pass(?:word)?|otp|one.?time|security.?code|cvv|cvc|card|payment|token|secret)/i;
const sensitiveAutocomplete = /(?:current-password|new-password|one-time-code|cc-|webauthn)/i;

export function canObserveField(field: FieldMetadata): boolean {
  const tagName = String(field.tagName ?? "").toLowerCase();
  if (tagName !== "input" && tagName !== "textarea" && tagName !== "select") return false;
  const type = String(field.type ?? "").toLowerCase();
  const identity = `${field.name ?? ""} ${field.id ?? ""} ${field.getAttribute?.("aria-label") ?? ""}`;
  const autocomplete = String(field.autocomplete ?? "");
  return !["hidden", "password", "file"].includes(type) && !sensitiveName.test(identity) && !sensitiveAutocomplete.test(autocomplete);
}

export function createRecordedEventSummary(eventKind: string, selector: string, actionHint?: string): RecordedEventSummary | undefined {
  if (eventKind !== "click" && eventKind !== "change" && eventKind !== "input") return undefined;
  if (actionHint !== undefined && actionHint !== "download") return undefined;
  return selector.length > 0 && selector.length <= 256 ? { eventKind, selector, ...(actionHint === "download" ? { actionHint } : {}) } : undefined;
}

export function normalizeRecordedPath(path: unknown): string | undefined {
  return typeof path === "string" && path.length > 0 && path.length <= 2048 && path.startsWith("/") && !path.startsWith("//") && !path.includes("..") ? path : undefined;
}
