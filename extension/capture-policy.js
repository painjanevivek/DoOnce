/* global module */

const sensitiveName = /(?:pass(?:word)?|otp|one.?time|security.?code|cvv|cvc|card|payment|token|secret)/i;
const sensitiveAutocomplete = /(?:current-password|new-password|one-time-code|cc-|webauthn)/i;

function canObserveField(field) {
  const tagName = String(field.tagName ?? "").toLowerCase();
  if (tagName !== "input" && tagName !== "textarea" && tagName !== "select") return false;
  const type = String(field.type ?? "").toLowerCase();
  const identity = `${field.name ?? ""} ${field.id ?? ""} ${field.getAttribute?.("aria-label") ?? ""}`;
  const autocomplete = String(field.autocomplete ?? "");
  return !["hidden", "password", "file"].includes(type) && !sensitiveName.test(identity) && !sensitiveAutocomplete.test(autocomplete);
}

function safeEventSummary(eventKind, selector) {
  if (!["click", "change", "input"].includes(eventKind)) return undefined;
  return { eventKind, selector };
}

const DoOnceCapturePolicy = { canObserveField, safeEventSummary };

if (typeof globalThis !== "undefined") globalThis.DoOnceCapturePolicy = DoOnceCapturePolicy;
if (typeof module !== "undefined") module.exports = DoOnceCapturePolicy;
