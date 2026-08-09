import type { LocatorStrategy } from "../../../contracts/protocol";

export type VideoMode = "video-with-telemetry" | "pure-video";
export type VideoStatus = "uploading" | "uploaded" | "analyzing" | "needs-input" | "needs-calibration" | "ready" | "completed" | "failed" | "cancelled";
export type VideoAction = "navigate" | "wait" | "read" | "select" | "type" | "download";

export interface VisualObservation {
  id: string;
  sequence: number;
  atMs: number;
  description: string;
  textHints: string[];
  confidence: number;
  normalizedBounds?: { x: number; y: number; width: number; height: number };
}

export interface VideoImport {
  id: string;
  mode: VideoMode;
  fileName: string;
  contentType: "video/mp4" | "video/webm" | "video/quicktime";
  byteSize: number;
  uploadedBytes: number;
  status: VideoStatus;
  workflowId?: string;
  errorCode?: string;
  retentionUntil: string;
  timeline?: {
    source: VideoMode;
    durationMs: number;
    observations: VisualObservation[];
    uncertainties: Array<{ code: string; message: string; observationIds: string[] }>;
  };
}

export interface CalibrationDraft {
  included: boolean;
  action: VideoAction;
  domain: string;
  path: string;
  locatorStrategy: LocatorStrategy;
  locatorValue: string;
  variableName: string;
}

export function defaultCalibration(observation: VisualObservation, startingUrl: string): CalibrationDraft {
  const url = safeUrl(startingUrl);
  return {
    included: true,
    action: observation.sequence === 0 ? "navigate" : "wait",
    domain: url?.hostname ?? "",
    path: url?.pathname || "/",
    locatorStrategy: "text",
    locatorValue: observation.textHints[0]?.slice(0, 256) ?? "",
    variableName: `value_${observation.sequence + 1}`,
  };
}

export function buildCalibrationRequest(startingUrl: string, observations: VisualObservation[], drafts: Record<string, CalibrationDraft>) {
  const mappings = observations.flatMap((observation) => {
    const draft = drafts[observation.id];
    if (!draft?.included) return [];
    const base = { observationId: observation.id, action: draft.action, domain: draft.domain.trim().toLowerCase(), path: draft.path.trim() };
    if (draft.action === "navigate") return [base];
    return [{
      ...base,
      locator: { schemaVersion: 1, primary: { strategy: draft.locatorStrategy, value: draft.locatorValue.trim(), confidence: 0.9 }, fallbacks: [] },
      ...(["type", "select"].includes(draft.action) ? { inputName: variableName(draft.variableName) } : {}),
      ...(draft.action === "read" ? { outputName: variableName(draft.variableName) } : {}),
    }];
  });
  return { startingUrl: startingUrl.trim(), mappings };
}

export function isVideoResponse(value: unknown): value is { video: VideoImport } {
  return isRecord(value) && isVideo(value.video);
}

export function isVideo(value: unknown): value is VideoImport {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.fileName !== "string" || !isMode(value.mode) || !isStatus(value.status) || !Number.isSafeInteger(value.byteSize) || !Number.isSafeInteger(value.uploadedBytes) || typeof value.retentionUntil !== "string") return false;
  if (value.timeline === undefined) return true;
  return isRecord(value.timeline) && Array.isArray(value.timeline.observations) && value.timeline.observations.length <= 100 && value.timeline.observations.every(isObservation);
}

export function readApiError(value: unknown): string {
  return isRecord(value) && typeof value.error === "string" ? value.error : "The video request could not be completed.";
}

function isObservation(value: unknown): value is VisualObservation {
  return isRecord(value) && typeof value.id === "string" && Number.isSafeInteger(value.sequence) && typeof value.description === "string" && Array.isArray(value.textHints) && value.textHints.every((item) => typeof item === "string") && typeof value.confidence === "number";
}
function isMode(value: unknown): value is VideoMode { return value === "pure-video" || value === "video-with-telemetry"; }
function isStatus(value: unknown): value is VideoStatus { return ["uploading", "uploaded", "analyzing", "needs-input", "needs-calibration", "ready", "completed", "failed", "cancelled"].includes(String(value)); }
function variableName(value: string): string { const normalized = value.trim().replace(/[^a-zA-Z0-9_]/g, "_"); return /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(normalized) ? normalized : "value"; }
function safeUrl(value: string): URL | undefined { try { return new URL(value); } catch { return undefined; } }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
