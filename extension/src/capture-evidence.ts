import type { CapturedValue, ElementEvidence, LocatorCandidate, LocatorSpec } from "../../contracts/protocol";

export interface ElementEvidenceInput {
  role?: string;
  accessibleName?: string;
  testId?: string;
  tagName: string;
  inputType?: string;
  textHint?: string;
  id?: string;
  label?: string;
  cssCandidate?: string;
  framePath: string[];
  viewportWidth: number;
  viewportHeight: number;
  visibleArea: number;
  elementArea: number;
}

export function createElementEvidence(input: ElementEvidenceInput): ElementEvidence {
  const candidates = locatorCandidates(input);
  if (candidates.length === 0) candidates.push({ strategy: "text", value: `${input.tagName}:unlabeled`, confidence: 0.2 });
  const locator: LocatorSpec = { schemaVersion: 1, primary: candidates[0]!, fallbacks: candidates.slice(1, 5) };
  const ratio = input.elementArea > 0 ? Math.min(1, Math.max(0, input.visibleArea / input.elementArea)) : 0;
  const role = bounded(input.role, 80);
  const accessibleName = bounded(input.accessibleName, 160);
  const testId = bounded(input.testId, 128);
  const inputType = bounded(input.inputType, 40);
  const textHint = bounded(input.textHint, 160);
  const cssCandidate = bounded(input.cssCandidate, 256);
  return {
    ...(role ? { role } : {}),
    ...(accessibleName ? { accessibleName } : {}),
    ...(testId ? { testId } : {}),
    tagName: input.tagName.toLowerCase().slice(0, 32),
    ...(inputType ? { inputType } : {}),
    ...(textHint ? { textHint } : {}),
    ...(cssCandidate ? { cssCandidate } : {}),
    framePath: input.framePath.slice(0, 8).map((frame) => frame.slice(0, 256)),
    domFingerprint: fingerprint([input.tagName, input.inputType, input.role, input.accessibleName, input.testId, input.id, input.label, input.textHint].join("|")),
    visibility: { inViewport: ratio > 0, ratio: Math.round(ratio * 1000) / 1000, viewportWidth: clampInteger(input.viewportWidth, 20_000), viewportHeight: clampInteger(input.viewportHeight, 20_000) },
    locator,
  };
}

export function classifyCapturedValue(value: string, metadata: { inputType?: string; name?: string; autocomplete?: string; protected?: boolean }): CapturedValue {
  const secretSignal = `${metadata.inputType ?? ""} ${metadata.name ?? ""} ${metadata.autocomplete ?? ""}`;
  if (metadata.protected || /pass|otp|one-time|card|cc-|cvc|cvv|secret|token|pin/i.test(secretSignal)) return { classification: "secret-placeholder", placeholder: "{{secret}}", length: value.length };
  if (value.length === 0) return { classification: "intentionally-omitted", placeholder: "{{empty}}", length: 0 };
  if (metadata.inputType === "date" || metadata.inputType === "email" || metadata.inputType === "tel" || metadata.inputType === "number" || metadata.inputType === "search" || metadata.inputType === "text") {
    return { classification: "variable-candidate", placeholder: `{{${variableName(metadata.name)}}}`, length: value.length };
  }
  return { classification: "literal-candidate", placeholder: "{{literal}}", length: value.length };
}

export function normalizeUrlPattern(input: string): string | undefined {
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    const ignored = /^(utm_|fbclid$|gclid$|_ga$|cache|nonce|token|session|sid|timestamp|ts$)/i;
    const keys = [...new Set([...url.searchParams.keys()].filter((key) => !ignored.test(key)))].sort().slice(0, 20);
    const query = keys.length ? `?${keys.map((key) => `${encodeURIComponent(key)}={value}`).join("&")}` : "";
    return `${url.origin}${url.pathname}${query}`.slice(0, 2048);
  } catch {
    return undefined;
  }
}

export function fingerprint(value: string): string {
  let hash = 0xcbf29ce484222325n;
  for (const character of value.slice(0, 2048)) {
    hash ^= BigInt(character.codePointAt(0) ?? 0);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function locatorCandidates(input: ElementEvidenceInput): LocatorCandidate[] {
  const candidates: LocatorCandidate[] = [];
  if (bounded(input.testId, 128)) candidates.push({ strategy: "capture-id", value: input.testId!, confidence: 1 });
  if (bounded(input.id, 128) && !/^[0-9a-f]{8,}$/i.test(input.id!)) candidates.push({ strategy: "id", value: input.id!, confidence: 0.95 });
  if (bounded(input.role, 80) && bounded(input.accessibleName, 160)) candidates.push({ strategy: "role", value: `${input.role}:${input.accessibleName}`, confidence: 0.9 });
  if (bounded(input.label, 160)) candidates.push({ strategy: "label", value: input.label!, confidence: 0.85 });
  if (bounded(input.textHint, 160)) candidates.push({ strategy: "text", value: input.textHint!, confidence: 0.6 });
  return candidates;
}

function bounded(value: string | undefined, maximum: number): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maximum) : undefined;
}

function variableName(value: string | undefined): string {
  const normalized = value?.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return normalized && /^[a-z]/.test(normalized) ? normalized.slice(0, 48) : "value";
}

function clampInteger(value: number, maximum: number): number {
  return Math.min(maximum, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));
}
