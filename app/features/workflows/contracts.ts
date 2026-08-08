export type CatalogState = "loading" | "ready" | "signed-out" | "unavailable" | "creating" | "publishing" | "error";
export type Workflow = { id: string; title: string; activeVersion: number | null; draftVersion: number | null; updatedAt: string };
export type WorkflowVersion = { id: string; title: string; version: number };
export type WorkflowReview = WorkflowVersion & { status: "draft"; allowedDomains: string[]; steps: Array<{ id: string; kind: string; name: string; expectedOutcome: string; domain: string; path: string }>; capabilitiesPreviewed: boolean; policyPreviewed?: boolean; testRunVerified: boolean };
export type RecordedActionSummary = { origin: string; path: string; eventKind: "click" | "change" | "input"; selector: string; actionHint?: "download" };
export type PauseReason = "changed-page" | "slow-network" | "unknown";
export type LocalReceipt = { id: string; origin: string; outcome: "completed" | "paused"; pauseReason?: PauseReason; finishedAt: string };
export type StoredReceipt = { id: string; outcome: "completed" | "paused"; pauseReason?: PauseReason; workflowVersion: number; finishedAt: string };
export type WorkflowAuditEvent = { id: string; version: number; eventType: "workflow.draft_created" | "workflow.policy_previewed" | "workflow.published" | "workflow.disabled" | "workflow.repair_draft_created"; createdAt: string };
export type SupportReportCategory = "workflow-paused" | "unexpected-result" | "safety-concern" | "other";
export type RunHealth = { workflowVersion: number; sampleSize: number; completedRuns: number; pausedRuns: number; successRate: number; pauseReasons: Partial<Record<PauseReason, number>>; meetsManualReliabilityThreshold: boolean };
export type MembershipRole = "owner" | "builder" | "runner" | "reviewer";

export const supportReportCategories: Array<{ value: SupportReportCategory; label: string }> = [
  { value: "workflow-paused", label: "Workflow paused" },
  { value: "unexpected-result", label: "Unexpected result" },
  { value: "safety-concern", label: "Execution concern" },
  { value: "other", label: "Other product problem" },
];

export function isSupportedDemoTarget(domain: string, path: string): boolean {
  return (domain === "localhost" || domain === "127.0.0.1") && path === "/demo/reports";
}

export function isSupportedDemoCapture(actions: RecordedActionSummary[]): boolean {
  return actions.every((action) => action.path === "/demo/reports") && actions.some((action) => action.eventKind === "click" && (action.selector === "#download-csv" || action.actionHint === "download"));
}

export function parseCaptureImport(value: unknown): { format: "doonce.capture.v2"; actions: RecordedActionSummary[]; migratedFromLegacy: boolean; workflowSpec?: WorkflowSpec } | undefined {
  if (!isRecord(value)) return undefined;
  const legacy = value.format === "doonce.safe-capture.v1";
  const actions = legacy ? value.summaries : value.format === "doonce.capture.v2" ? value.actions : undefined;
  if (!Array.isArray(actions) || actions.length === 0 || actions.length > 500) return undefined;
  const parsed: RecordedActionSummary[] = [];
  for (const action of actions) {
    const normalized = normalizeRecordedAction(action, legacy);
    if (!normalized) return undefined;
    parsed.push(normalized);
  }
  const workflowSpec = value.workflowSpec === undefined ? undefined : validateContract<WorkflowSpec>("WorkflowSpec", value.workflowSpec);
  if (workflowSpec && !workflowSpec.ok) return undefined;
  return { format: "doonce.capture.v2", actions: parsed, migratedFromLegacy: legacy, ...(workflowSpec?.ok ? { workflowSpec: workflowSpec.value } : {}) };
}

export function isWorkflowList(value: unknown): value is { workflows: Workflow[] } {
  return isRecord(value) && Array.isArray(value.workflows) && value.workflows.every(isWorkflow);
}

export function isWorkflowCapabilitiesSummary(value: unknown): value is { workflowChangesEnabled: boolean } {
  return isRecord(value) && typeof value.workflowChangesEnabled === "boolean";
}

export function isCurrentUser(value: unknown): value is { user: { role: MembershipRole } } {
  return isRecord(value) && isRecord(value.user) && isMembershipRole(value.user.role);
}

export function isWorkflowVersionResponse(value: unknown): value is { workflow: WorkflowVersion } {
  return isRecord(value) && isRecord(value.workflow) && typeof value.workflow.id === "string" && typeof value.workflow.title === "string" && typeof value.workflow.version === "number";
}

export function isWorkflowReviewResponse(value: unknown): value is { workflow: WorkflowReview } {
  if (!isWorkflowVersionResponse(value)) return false;
  const workflow = value.workflow as unknown as Record<string, unknown>;
  return workflow.status === "draft" && typeof workflow.capabilitiesPreviewed === "boolean" && typeof workflow.testRunVerified === "boolean" && Array.isArray(workflow.allowedDomains) && workflow.allowedDomains.every((domain) => typeof domain === "string") && Array.isArray(workflow.steps) && workflow.steps.every((step) => isRecord(step) && typeof step.name === "string" && typeof step.domain === "string" && typeof step.path === "string");
}

export function isRepairDraftResponse(value: unknown): value is { workflow: WorkflowReview; repair: "reconfirm-step" } {
  return isWorkflowReviewResponse(value) && (value as Record<string, unknown>).repair === "reconfirm-step";
}

export const isDraftTestReceiptResponse = isWorkflowReviewResponse;

export function isLocalReceiptFile(value: unknown): value is { format: "doonce.local-run-receipt.v1"; receipts: LocalReceipt[] } {
  return isRecord(value) && value.format === "doonce.local-run-receipt.v1" && Array.isArray(value.receipts) && value.receipts.length > 0 && value.receipts.every(isLocalReceipt);
}

export function isReceiptHistory(value: unknown): value is { receipts: StoredReceipt[] } {
  return isRecord(value) && Array.isArray(value.receipts) && value.receipts.every(isStoredReceipt);
}

export function isRunHealthResponse(value: unknown): value is { health: RunHealth } {
  if (!isRecord(value) || !isRecord(value.health)) return false;
  const record = value.health;
  const pauseReasons = record.pauseReasons;
  return typeof record.workflowVersion === "number" && Number.isInteger(record.workflowVersion) && record.workflowVersion > 0 && typeof record.sampleSize === "number" && Number.isInteger(record.sampleSize) && record.sampleSize >= 0 && record.sampleSize <= 50 && typeof record.completedRuns === "number" && Number.isInteger(record.completedRuns) && record.completedRuns >= 0 && typeof record.pausedRuns === "number" && Number.isInteger(record.pausedRuns) && record.pausedRuns >= 0 && record.completedRuns + record.pausedRuns === record.sampleSize && typeof record.successRate === "number" && Number.isInteger(record.successRate) && record.successRate >= 0 && record.successRate <= 100 && typeof record.meetsManualReliabilityThreshold === "boolean" && isRecord(pauseReasons) && Object.entries(pauseReasons).every(([reason, count]) => isPauseReason(reason) && typeof count === "number" && Number.isInteger(count) && count > 0);
}

export function isWorkflowAuditHistory(value: unknown): value is { events: WorkflowAuditEvent[] } {
  return isRecord(value) && Array.isArray(value.events) && value.events.every((event) => isRecord(event) && isUuid(event.id) && typeof event.version === "number" && Number.isInteger(event.version) && event.version > 0 && ["workflow.draft_created", "workflow.policy_previewed", "workflow.published", "workflow.disabled", "workflow.repair_draft_created"].includes(event.eventType as string) && isTimestamp(event.createdAt));
}

export function isDisableResponse(value: unknown): value is { workflowId: string; disabledVersion: number } {
  return isRecord(value) && isUuid(value.workflowId) && typeof value.disabledVersion === "number" && Number.isInteger(value.disabledVersion) && value.disabledVersion > 0;
}

export function isSupportReportResponse(value: unknown): value is { report: { id: string; category: SupportReportCategory; createdAt: string; diagnosticIncluded: boolean } } {
  if (!isRecord(value) || !isRecord(value.report)) return false;
  const report = value.report;
  return isUuid(report.id) && supportReportCategories.some((category) => category.value === report.category) && isTimestamp(report.createdAt) && typeof report.diagnosticIncluded === "boolean";
}

function isWorkflow(value: unknown): value is Workflow {
  return isRecord(value) && typeof value.id === "string" && typeof value.title === "string" && (typeof value.activeVersion === "number" || value.activeVersion === null) && ((typeof value.draftVersion === "number" && Number.isInteger(value.draftVersion) && value.draftVersion > 0) || value.draftVersion === null) && typeof value.updatedAt === "string";
}

function normalizeRecordedAction(value: unknown, legacy: boolean): RecordedActionSummary | undefined {
  if (!isRecord(value) || typeof value.origin !== "string" || (value.eventKind !== "click" && value.eventKind !== "change" && value.eventKind !== "input") || typeof value.selector !== "string" || value.selector.length === 0 || value.selector.length > 256 || (value.actionHint !== undefined && value.actionHint !== "download")) return undefined;
  const path = legacy && value.path === undefined ? "/" : isRecordedPath(value.path) ? value.path : undefined;
  if (!path) return undefined;
  return { origin: value.origin, path, eventKind: value.eventKind, selector: value.selector, ...(value.actionHint === "download" ? { actionHint: "download" as const } : {}) };
}

function isStoredReceipt(value: unknown): value is StoredReceipt {
  return isRecord(value) && isUuid(value.id) && (value.outcome === "completed" || value.outcome === "paused") && typeof value.workflowVersion === "number" && Number.isInteger(value.workflowVersion) && value.workflowVersion > 0 && isTimestamp(value.finishedAt) && (value.outcome !== "paused" || isPauseReason(value.pauseReason));
}

function isLocalReceipt(value: unknown): value is LocalReceipt {
  return isRecord(value) && isUuid(value.id) && typeof value.origin === "string" && isLocalOrigin(value.origin) && (value.outcome === "completed" || value.outcome === "paused") && isTimestamp(value.finishedAt) && (value.outcome !== "paused" || isPauseReason(value.pauseReason));
}

function isMembershipRole(value: unknown): value is MembershipRole {
  return value === "owner" || value === "builder" || value === "runner" || value === "reviewer";
}

function isPauseReason(value: unknown): value is PauseReason {
  return value === "changed-page" || value === "slow-network" || value === "unknown";
}

function isLocalOrigin(value: string): boolean {
  try {
    const origin = new URL(value);
    return origin.origin === value && (origin.protocol === "http:" || origin.protocol === "https:") && ["localhost", "127.0.0.1"].includes(origin.hostname);
  } catch {
    return false;
  }
}

function isRecordedPath(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 2048 && value.startsWith("/") && !value.startsWith("//") && !value.includes("..");
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
import type { WorkflowSpec } from "../../../contracts/protocol";
import { validateContract } from "../../../contracts/validation";
