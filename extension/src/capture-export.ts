import { normalizeRecordedPath, type RecordedEventKind } from "./capture-eligibility";

export const captureExportFormat = "doonce.capture.v2" as const;
export const legacyCaptureExportFormat = "doonce.safe-capture.v1" as const;

export interface RecordedActionSummary {
  origin: string;
  path: string;
  eventKind: RecordedEventKind;
  selector: string;
  actionHint?: "download";
}

export interface CaptureExportV2 {
  format: typeof captureExportFormat;
  recordedAt: string;
  actions: RecordedActionSummary[];
}

export type CaptureExportParseResult =
  | { ok: true; value: CaptureExportV2; migratedFrom?: typeof legacyCaptureExportFormat }
  | { ok: false; errors: string[] };

export function createCaptureExport(actions: readonly RecordedActionSummary[], recordedAt = new Date().toISOString()): CaptureExportV2 {
  const result = validateActions(actions);
  if (!result.ok) throw new TypeError(result.errors.join(" "));
  if (Number.isNaN(Date.parse(recordedAt))) throw new TypeError("Capture export timestamp is invalid.");
  return { format: captureExportFormat, recordedAt, actions: [...actions] };
}

export function parseCaptureExport(input: unknown): CaptureExportParseResult {
  if (!isRecord(input)) return { ok: false, errors: ["Capture export must be an object."] };

  if (input.format === captureExportFormat) {
    if (!Number.isNaN(Date.parse(String(input.recordedAt)))) {
      const actions = validateActions(input.actions);
      if (actions.ok) return { ok: true, value: { format: captureExportFormat, recordedAt: String(input.recordedAt), actions: actions.value } };
      return actions;
    }
    return { ok: false, errors: ["Capture export timestamp is invalid."] };
  }

  if (input.format === legacyCaptureExportFormat) {
    const actions = validateActions(input.summaries, true);
    if (!actions.ok) return actions;
    return {
      ok: true,
      value: { format: captureExportFormat, recordedAt: new Date(0).toISOString(), actions: actions.value },
      migratedFrom: legacyCaptureExportFormat,
    };
  }

  return { ok: false, errors: ["Capture export format is unsupported."] };
}

function validateActions(input: unknown, legacy = false): { ok: true; value: RecordedActionSummary[] } | { ok: false; errors: string[] } {
  if (!Array.isArray(input) || input.length === 0 || input.length > 500) {
    return { ok: false, errors: ["Capture export must contain between 1 and 500 actions."] };
  }
  const actions: RecordedActionSummary[] = [];
  for (const [index, value] of input.entries()) {
    const path = isRecord(value) && legacy && value.path === undefined ? "/" : isRecord(value) ? normalizeRecordedPath(value.path) : undefined;
    if (!isRecord(value) || !hasOnlyKeys(value, ["origin", "path", "eventKind", "selector", "actionHint"]) || !isValidOrigin(value.origin) || path === undefined || !isEventKind(value.eventKind) || typeof value.selector !== "string" || value.selector.length === 0 || value.selector.length > 256 || (value.actionHint !== undefined && value.actionHint !== "download")) {
      return { ok: false, errors: [`Capture action ${index + 1} is invalid${legacy ? " in the legacy export" : ""}.`] };
    }
    actions.push({ origin: value.origin, path, eventKind: value.eventKind, selector: value.selector, ...(value.actionHint === "download" ? { actionHint: "download" as const } : {}) });
  }
  return { ok: true, value: actions };
}

function isEventKind(value: unknown): value is RecordedEventKind {
  return value === "click" || value === "change" || value === "input";
}

function isValidOrigin(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.origin === value && (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)));
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
