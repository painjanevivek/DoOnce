import type { WorkflowSpec } from "../../../contracts/protocol";

export interface WorkflowSummary {
  id: string; title: string; activeVersion: number | null; draftVersion: number | null; status: "draft" | "active" | "archived";
  updatedAt: string; lastRunAt: string | null; successRate: number | null;
}
export interface WorkflowDraft { id: string; version: number; status: "draft"; spec: WorkflowSpec; checksum: string }
export interface WorkflowVersion { id: string; version: number; status: "draft" | "active" | "archived"; spec: WorkflowSpec; checksum: string; createdAt: string; publishedAt: string | null }
export interface TestPreview {
  workflowId: string; version: number; checksum: string; executor: "extension" | "hosted-browser"; status: "ready";
  inputs: Array<{ name: string; provided: boolean; secret: boolean }>;
  steps: Array<{ id: string; name: string; action: string; readiness: "ready" | "approval-required" | "checkpoint"; message: string }>;
}
