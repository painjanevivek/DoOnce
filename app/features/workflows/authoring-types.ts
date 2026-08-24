import type { WorkflowSpec } from "../../../contracts/protocol";

export interface WorkflowSummary {
  id: string; title: string; activeVersion: number | null; draftVersion: number | null; status: "draft" | "active" | "archived";
  updatedAt: string; lastRunAt: string | null; successRate: number | null;
}
export interface WorkflowDraft { id: string; version: number; status: "draft"; spec: WorkflowSpec; checksum: string; testEvidenceVerified?: boolean }
export interface WorkflowVersion { id: string; version: number; status: "draft" | "active" | "archived"; spec: WorkflowSpec; checksum: string; testEvidenceRunId: string | null; createdAt: string; publishedAt: string | null }
export interface TestPreview {
  workflowId: string; version: number; checksum: string; executor: "extension" | "hosted-browser"; status: "ready";
  inputs: Array<{ name: string; provided: boolean; secret: boolean }>;
  steps: Array<{ id: string; name: string; action: string; readiness: "ready" | "approval-required" | "checkpoint"; message: string }>;
}
export interface SystemCapabilities {
  workflowChangesEnabled: boolean;
  mvp: {
    enabled: boolean;
    pilotOrigin: string | null;
    authoringModes: Array<"record" | "text" | "video">;
    executionModes: Array<"attended-extension" | "hosted" | "schedule" | "webhook">;
    outcome: "verified-report-download" | null;
  };
}

export function isSystemCapabilities(value: unknown): value is SystemCapabilities {
  if (!isRecord(value) || typeof value.workflowChangesEnabled !== "boolean" || !isRecord(value.mvp)) return false;
  const mvp = value.mvp;
  return typeof mvp.enabled === "boolean"
    && (mvp.pilotOrigin === null || isExactHttpsOrigin(mvp.pilotOrigin))
    && (!mvp.enabled || mvp.pilotOrigin !== null)
    && Array.isArray(mvp.authoringModes)
    && mvp.authoringModes.every((mode) => mode === "record" || mode === "text" || mode === "video")
    && Array.isArray(mvp.executionModes)
    && mvp.executionModes.every((mode) => mode === "attended-extension" || mode === "hosted" || mode === "schedule" || mode === "webhook")
    && (mvp.outcome === null || mvp.outcome === "verified-report-download");
}

function isExactHttpsOrigin(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value && url.pathname === "/" && !url.search && !url.hash;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
