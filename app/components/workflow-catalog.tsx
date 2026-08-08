"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

type CatalogState = "loading" | "ready" | "signed-out" | "unavailable" | "creating" | "publishing" | "error";
type Workflow = { id: string; title: string; activeVersion: number | null; draftVersion: number | null; updatedAt: string };
type WorkflowVersion = { id: string; title: string; version: number };
type WorkflowReview = WorkflowVersion & { status: "draft"; allowedDomains: string[]; steps: Array<{ id: string; kind: string; name: string; expectedOutcome: string; domain: string; path: string }>; policyPreviewed: boolean; testRunVerified: boolean };
type SafeCaptureSummary = { origin: string; path?: string; eventKind: "click" | "change" | "input"; selector: string };
type PauseReason = "changed-page" | "slow-network" | "unknown";
type LocalReceipt = { id: string; origin: string; outcome: "completed" | "paused"; pauseReason?: PauseReason; finishedAt: string };
type StoredReceipt = { id: string; outcome: "completed" | "paused"; pauseReason?: PauseReason; workflowVersion: number; finishedAt: string };
type WorkflowAuditEvent = { id: string; version: number; eventType: "workflow.draft_created" | "workflow.policy_previewed" | "workflow.published" | "workflow.disabled" | "workflow.repair_draft_created"; createdAt: string };
type SupportReportCategory = "workflow-paused" | "unexpected-result" | "safety-concern" | "other";
type RunHealth = { workflowVersion: number; sampleSize: number; completedRuns: number; pausedRuns: number; successRate: number; pauseReasons: Partial<Record<PauseReason, number>>; meetsManualReliabilityThreshold: boolean };
type MembershipRole = "owner" | "builder" | "runner" | "reviewer";

const supportReportCategories: Array<{ value: SupportReportCategory; label: string }> = [
  { value: "workflow-paused", label: "Workflow paused safely" },
  { value: "unexpected-result", label: "Unexpected result" },
  { value: "safety-concern", label: "Safety concern" },
  { value: "other", label: "Other product problem" },
];

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

function isSupportedDemoTarget(domain: string, path: string): boolean {
  return (domain === "localhost" || domain === "127.0.0.1") && path === "/demo/reports";
}

function isSafeCapturePath(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 2048 && value.startsWith("/") && !value.startsWith("//") && !value.includes("..");
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isPauseReason(value: unknown): value is PauseReason {
  return value === "changed-page" || value === "slow-network" || value === "unknown";
}

function isLocalOrigin(value: string): boolean {
  try {
    const origin = new URL(value);
    return (origin.protocol === "http:" || origin.protocol === "https:") && ["localhost", "127.0.0.1"].includes(origin.hostname);
  } catch {
    return false;
  }
}

function isSupportedDemoCapture(summaries: SafeCaptureSummary[]): boolean {
  return summaries.every((summary) => summary.path === "/demo/reports") && summaries.some((summary) => summary.eventKind === "click" && summary.selector === "#download-csv");
}

function isWorkflow(value: unknown): value is Workflow {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.title === "string" && (typeof record.activeVersion === "number" || record.activeVersion === null) && ((typeof record.draftVersion === "number" && Number.isInteger(record.draftVersion) && record.draftVersion > 0) || record.draftVersion === null) && typeof record.updatedAt === "string";
}

function isWorkflowList(value: unknown): value is { workflows: Workflow[] } {
  return typeof value === "object" && value !== null && Array.isArray((value as Record<string, unknown>).workflows) && (value as { workflows: unknown[] }).workflows.every(isWorkflow);
}

function isWorkflowSafetySummary(value: unknown): value is { workflowChangesEnabled: boolean } {
  return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>).workflowChangesEnabled === "boolean";
}

function isMembershipRole(value: unknown): value is MembershipRole {
  return value === "owner" || value === "builder" || value === "runner" || value === "reviewer";
}

function isCurrentUser(value: unknown): value is { user: { role: MembershipRole } } {
  if (typeof value !== "object" || value === null) return false;
  const user = (value as Record<string, unknown>).user;
  return typeof user === "object" && user !== null && isMembershipRole((user as Record<string, unknown>).role);
}

function isWorkflowVersionResponse(value: unknown): value is { workflow: WorkflowVersion } {
  if (typeof value !== "object" || value === null) return false;
  const workflow = (value as Record<string, unknown>).workflow;
  if (typeof workflow !== "object" || workflow === null) return false;
  const record = workflow as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.title === "string" && typeof record.version === "number";
}

function isWorkflowReviewResponse(value: unknown): value is { workflow: WorkflowReview } {
  if (!isWorkflowVersionResponse(value)) return false;
  const workflow = value.workflow as unknown as Record<string, unknown>;
  return workflow.status === "draft" && typeof workflow.policyPreviewed === "boolean" && typeof workflow.testRunVerified === "boolean" && Array.isArray(workflow.allowedDomains) && workflow.allowedDomains.every((domain) => typeof domain === "string") && Array.isArray(workflow.steps) && workflow.steps.every((step) => typeof step === "object" && step !== null && typeof (step as Record<string, unknown>).name === "string" && typeof (step as Record<string, unknown>).domain === "string" && typeof (step as Record<string, unknown>).path === "string");
}

function isRepairDraftResponse(value: unknown): value is { workflow: WorkflowReview; repair: "reconfirm-safe-step" } {
  return isWorkflowReviewResponse(value) && (value as Record<string, unknown>).repair === "reconfirm-safe-step";
}

function isDraftTestReceiptResponse(value: unknown): value is { workflow: WorkflowReview } {
  return isWorkflowReviewResponse(value);
}

function isSafeCaptureFile(value: unknown): value is { format: "doonce.safe-capture.v1"; summaries: SafeCaptureSummary[] } {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return record.format === "doonce.safe-capture.v1" && Array.isArray(record.summaries) && record.summaries.length > 0 && record.summaries.every((summary) => typeof summary === "object" && summary !== null && typeof (summary as Record<string, unknown>).origin === "string" && ((summary as Record<string, unknown>).path === undefined || isSafeCapturePath((summary as Record<string, unknown>).path)) && ["click", "change", "input"].includes((summary as Record<string, unknown>).eventKind as string) && typeof (summary as Record<string, unknown>).selector === "string");
}

function isLocalReceiptFile(value: unknown): value is { format: "doonce.local-run-receipt.v1"; receipts: LocalReceipt[] } {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return record.format === "doonce.local-run-receipt.v1" && Array.isArray(record.receipts) && record.receipts.length > 0 && record.receipts.every((receipt) => { const item = receipt as Record<string, unknown>; return typeof receipt === "object" && receipt !== null && isUuid(item.id) && typeof item.origin === "string" && isLocalOrigin(item.origin) && ["completed", "paused"].includes(item.outcome as string) && isTimestamp(item.finishedAt) && (item.outcome !== "paused" || isPauseReason(item.pauseReason)); });
}

function isStoredReceipt(value: unknown): value is StoredReceipt {
  if (typeof value !== "object" || value === null) return false;
  const receipt = value as Record<string, unknown>;
  return isUuid(receipt.id) && ["completed", "paused"].includes(receipt.outcome as string) && typeof receipt.workflowVersion === "number" && Number.isInteger(receipt.workflowVersion) && receipt.workflowVersion > 0 && isTimestamp(receipt.finishedAt) && (receipt.outcome !== "paused" || isPauseReason(receipt.pauseReason));
}

function isReceiptHistory(value: unknown): value is { receipts: StoredReceipt[] } {
  return typeof value === "object" && value !== null && Array.isArray((value as Record<string, unknown>).receipts) && (value as { receipts: unknown[] }).receipts.every(isStoredReceipt);
}

function isRunHealthResponse(value: unknown): value is { health: RunHealth } {
  if (typeof value !== "object" || value === null) return false;
  const health = (value as Record<string, unknown>).health;
  if (typeof health !== "object" || health === null || Array.isArray(health)) return false;
  const record = health as Record<string, unknown>;
  const pauseReasons = record.pauseReasons;
  return typeof record.workflowVersion === "number" && Number.isInteger(record.workflowVersion) && record.workflowVersion > 0 && typeof record.sampleSize === "number" && Number.isInteger(record.sampleSize) && record.sampleSize >= 0 && record.sampleSize <= 50 && typeof record.completedRuns === "number" && Number.isInteger(record.completedRuns) && record.completedRuns >= 0 && typeof record.pausedRuns === "number" && Number.isInteger(record.pausedRuns) && record.pausedRuns >= 0 && record.completedRuns + record.pausedRuns === record.sampleSize && typeof record.successRate === "number" && Number.isInteger(record.successRate) && record.successRate >= 0 && record.successRate <= 100 && typeof record.meetsManualReliabilityThreshold === "boolean" && typeof pauseReasons === "object" && pauseReasons !== null && !Array.isArray(pauseReasons) && Object.entries(pauseReasons).every(([reason, count]) => isPauseReason(reason) && typeof count === "number" && Number.isInteger(count) && count > 0);
}

function isWorkflowAuditHistory(value: unknown): value is { events: WorkflowAuditEvent[] } {
  if (typeof value !== "object" || value === null || !Array.isArray((value as Record<string, unknown>).events)) return false;
  return (value as { events: unknown[] }).events.every((event) => {
    if (typeof event !== "object" || event === null) return false;
    const item = event as Record<string, unknown>;
    return isUuid(item.id) && typeof item.version === "number" && Number.isInteger(item.version) && item.version > 0 && ["workflow.draft_created", "workflow.policy_previewed", "workflow.published", "workflow.disabled", "workflow.repair_draft_created"].includes(item.eventType as string) && isTimestamp(item.createdAt);
  });
}

function isDisableResponse(value: unknown): value is { workflowId: string; disabledVersion: number } {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return isUuid(record.workflowId) && typeof record.disabledVersion === "number" && Number.isInteger(record.disabledVersion) && record.disabledVersion > 0;
}

function isSupportReportResponse(value: unknown): value is { report: { id: string; category: SupportReportCategory; createdAt: string; diagnosticIncluded: boolean } } {
  if (typeof value !== "object" || value === null) return false;
  const report = (value as Record<string, unknown>).report;
  if (typeof report !== "object" || report === null) return false;
  const record = report as Record<string, unknown>;
  return isUuid(record.id) && supportReportCategories.some((category) => category.value === record.category) && isTimestamp(record.createdAt) && typeof record.diagnosticIncluded === "boolean";
}

export default function WorkflowCatalog() {
  const [state, setState] = useState<CatalogState>("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [workflowChangesEnabled, setWorkflowChangesEnabled] = useState(false);
  const [role, setRole] = useState<MembershipRole | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [draft, setDraft] = useState<WorkflowReview | null>(null);
  const [message, setMessage] = useState("");
  const [previewState, setPreviewState] = useState<"idle" | "running" | "passed">("idle");
  const [title, setTitle] = useState("Download local demo report");
  const [domain, setDomain] = useState("127.0.0.1");
  const [path, setPath] = useState("/demo/reports");
  const [receipt, setReceipt] = useState<LocalReceipt | null>(null);
  const [resumeDraftId, setResumeDraftId] = useState("");
  const [resumeState, setResumeState] = useState<"idle" | "loading">("idle");
  const [receiptWorkflowId, setReceiptWorkflowId] = useState("");
  const [historyWorkflowId, setHistoryWorkflowId] = useState("");
  const [receiptHistory, setReceiptHistory] = useState<StoredReceipt[] | null>(null);
  const [historyState, setHistoryState] = useState<"idle" | "loading">("idle");
  const [healthWorkflowId, setHealthWorkflowId] = useState("");
  const [runHealth, setRunHealth] = useState<RunHealth | null>(null);
  const [healthState, setHealthState] = useState<"idle" | "loading">("idle");
  const [auditWorkflowId, setAuditWorkflowId] = useState("");
  const [auditEvents, setAuditEvents] = useState<WorkflowAuditEvent[] | null>(null);
  const [auditState, setAuditState] = useState<"idle" | "loading">("idle");
  const [disableWorkflowId, setDisableWorkflowId] = useState("");
  const [disableState, setDisableState] = useState<"idle" | "disabling">("idle");
  const [repairWorkflowId, setRepairWorkflowId] = useState("");
  const [repairState, setRepairState] = useState<"idle" | "creating">("idle");
  const [supportCategory, setSupportCategory] = useState<SupportReportCategory>("workflow-paused");
  const [supportState, setSupportState] = useState<"idle" | "sending">("idle");
  const [supportWorkflowId, setSupportWorkflowId] = useState("");
  const [includeSupportRunHealth, setIncludeSupportRunHealth] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4_000);
    let active = true;
    async function load() {
      try {
        const [response, safetyResponse, accountResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/v1/workflows`, { credentials: "include", headers: { Accept: "application/json" }, signal: controller.signal }),
          fetch(`${apiBaseUrl}/api/v1/system/safety`, { headers: { Accept: "application/json" }, signal: controller.signal }),
          fetch(`${apiBaseUrl}/api/v1/auth/me`, { credentials: "include", headers: { Accept: "application/json" }, signal: controller.signal }),
        ]);
        if (response.status === 401 || accountResponse.status === 401) return setState("signed-out");
        const [body, safety, account]: unknown[] = await Promise.all([response.json(), safetyResponse.json(), accountResponse.json()]);
        if (!response.ok || !isWorkflowList(body) || !safetyResponse.ok || !isWorkflowSafetySummary(safety) || !accountResponse.ok || !isCurrentUser(account)) return setState("unavailable");
        setWorkflows(body.workflows);
        setWorkflowChangesEnabled(safety.workflowChangesEnabled);
        setRole(account.user.role);
        setState("ready");
      } catch {
        if (active) setState("unavailable");
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [loadAttempt]);

  const canAuthor = role === "owner" || role === "builder";
  const canImportRunReceipts = canAuthor || role === "runner";
  const canDisable = role === "owner";

  async function createSafeDraft(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!canAuthor) {
      setState("error");
      setMessage("Your workspace role can inspect workflows but cannot create drafts.");
      return;
    }
    if (!workflowChangesEnabled) {
      setState("error");
      setMessage("Workflow changes are paused by the server safety control. Nothing was created.");
      return;
    }
    const normalizedDomain = domain.trim().toLowerCase();
    const normalizedPath = path.trim();
    if (!title.trim() || !isSupportedDemoTarget(normalizedDomain, normalizedPath)) {
      setState("error");
      setMessage("This pilot can create drafts only for localhost or 127.0.0.1 at /demo/reports.");
      return;
    }
    setState("creating");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          allowedDomains: [normalizedDomain],
          steps: [{ id: crypto.randomUUID(), kind: "download", name: "Download reviewed report", expectedOutcome: "A CSV report is downloaded.", domain: normalizedDomain, path: normalizedPath }],
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok || !isWorkflowVersionResponse(body)) throw new Error("Draft was not confirmed.");
      const reviewResponse = await fetch(`${apiBaseUrl}/api/v1/workflows/${body.workflow.id}`, { credentials: "include", headers: { Accept: "application/json" } });
      const reviewBody: unknown = await reviewResponse.json();
      if (!reviewResponse.ok || !isWorkflowReviewResponse(reviewBody)) throw new Error("Draft review was not confirmed.");
      setDraft(reviewBody.workflow);
      setPreviewState("idle");
      setWorkflows((current) => [{ id: body.workflow.id, title: body.workflow.title, activeVersion: null, draftVersion: body.workflow.version, updatedAt: new Date().toISOString() }, ...current]);
      setState("ready");
      setMessage("Safe report-download draft created. Review it before publishing.");
    } catch {
      setState("error");
      setMessage("The draft was not confirmed. No workflow was enabled.");
    }
  }

  async function previewDraft() {
    if (!draft) return;
    if (!canAuthor) {
      setState("error");
      setMessage("Your workspace role cannot record a policy preview.");
      return;
    }
    setPreviewState("running");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${draft.id}/preview`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (!response.ok || !isWorkflowReviewResponse(body) || (body as { preview?: unknown }).preview !== "policy-passed") throw new Error("Preview was not confirmed.");
      setDraft(body.workflow);
      setPreviewState(body.workflow.policyPreviewed ? "passed" : "idle");
      setMessage("Policy preview passed. Review the saved steps once more before publishing.");
    } catch {
      setPreviewState("idle");
      setState("error");
      setMessage("Policy preview did not pass. Nothing was activated.");
    }
  }

  async function importCapture(file: File | undefined) {
    if (!file || file.size > 128_000) return setMessage("Choose a small DoOnce local review file.");
    try {
      const payload: unknown = JSON.parse(await file.text());
      if (!isSafeCaptureFile(payload)) throw new Error("Invalid capture file.");
      const origin = new URL(payload.summaries[0].origin);
      if (!payload.summaries.every((summary) => summary.origin === origin.origin) || (origin.protocol !== "https:" && origin.hostname !== "localhost" && origin.hostname !== "127.0.0.1")) throw new Error("Unapproved origin.");
      setDomain(origin.hostname);
      if (isSupportedDemoCapture(payload.summaries)) {
        setTitle("Download captured weekly sales report");
        setPath("/demo/reports");
        setMessage("Recognized the safe local report-download pattern. Its domain and path are ready for review before creating a draft.");
      } else {
        setTitle(`Review captured report from ${origin.hostname}`);
        setMessage(`${payload.summaries.length} local, value-free event summaries imported. This capture is review-only and cannot create a runnable pilot draft until it matches the supported workflow pattern.`);
      }
    } catch {
      setState("error");
      setMessage("That file is not a valid DoOnce local capture export.");
    }
  }

  async function publishDraft() {
    if (!draft) return;
    if (!canAuthor) {
      setState("error");
      setMessage("Your workspace role cannot publish drafts.");
      return;
    }
    if (!workflowChangesEnabled) {
      setState("error");
      setMessage("Workflow changes are paused by the server safety control. This draft remains unpublished.");
      return;
    }
    setState("publishing");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${draft.id}/publish`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (!response.ok || !isWorkflowVersionResponse(body)) throw new Error("Publication was not confirmed.");
      setWorkflows((current) => current.map((workflow) => workflow.id === body.workflow.id ? { ...workflow, activeVersion: body.workflow.version, draftVersion: null } : workflow));
      setDraft(null);
      setResumeDraftId("");
      setState("ready");
      setMessage("Workflow published. It remains limited to the approved report-download step.");
    } catch {
      setState("error");
      setMessage("Publication was not confirmed. The workflow remains a draft or was not created.");
    }
  }

  async function importReceipt(file: File | undefined) {
    setReceipt(null);
    if (!file || file.size > 128_000) {
      setState("error");
      setMessage("Choose a small local receipt file.");
      return;
    }
    try {
      const payload: unknown = JSON.parse(await file.text());
      if (!isLocalReceiptFile(payload)) throw new Error("Invalid receipt.");
      const latest = payload.receipts.at(-1)!;
      setReceipt(latest);
      setState("ready");
      setMessage(`Local ${latest.outcome} receipt ready for explicit dashboard confirmation.`);
    } catch { setState("error"); setMessage("That file is not a valid local receipt export."); }
  }

  async function resumeDraft() {
    if (!resumeDraftId) return;
    setResumeState("loading");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${resumeDraftId}`, { credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (response.status === 401) return setState("signed-out");
      if (!response.ok || !isWorkflowReviewResponse(body)) throw new Error("Draft review was not confirmed.");
      setDraft(body.workflow);
      setReceipt(null);
      setPreviewState(body.workflow.policyPreviewed ? "passed" : "idle");
      setMessage(`Draft version ${body.workflow.version} restored. ${body.workflow.policyPreviewed ? "Its server policy preview remains recorded." : "Run its server policy preview before publishing."}`);
    } catch {
      setMessage("This saved draft could not be restored. It remains unpublished.");
    } finally {
      setResumeState("idle");
    }
  }

  async function saveReceipt() {
    if (!receipt || !receiptWorkflowId) return;
    if (!canImportRunReceipts) {
      setState("error");
      setMessage("Your workspace role can review receipts but cannot save them.");
      return;
    }
    setState("creating");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${receiptWorkflowId}/run-receipts/import`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ sourceId: receipt.id, outcome: receipt.outcome, ...(receipt.pauseReason ? { pauseReason: receipt.pauseReason } : {}) }) });
      if (response.status === 409) { setReceipt(null); setState("ready"); setMessage("This receipt was already saved to a workflow."); return; }
      if (!response.ok) throw new Error("Not confirmed");
      setReceipt(null); setState("ready"); setMessage("Receipt saved to the selected active workflow.");
    } catch { setState("error"); setMessage("Receipt was not confirmed. Nothing was saved."); }
  }

  async function confirmDraftTestReceipt() {
    if (!receipt || !draft) return;
    if (!canImportRunReceipts) {
      setState("error");
      setMessage("Your workspace role can review receipts but cannot confirm draft tests.");
      return;
    }
    if (receipt.outcome !== "completed") {
      setMessage("A paused receipt cannot unlock publication. Run the reviewed draft again and confirm a completed receipt.");
      return;
    }
    setState("creating");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${draft.id}/test-receipts/import`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ sourceId: receipt.id, outcome: "completed" }) });
      const body: unknown = await response.json();
      if (response.status === 409) { setReceipt(null); setState("ready"); setMessage("This completed test receipt was already saved for the draft."); return; }
      if (!response.ok || !isDraftTestReceiptResponse(body) || !body.workflow.testRunVerified) throw new Error("Draft test was not confirmed.");
      setDraft(body.workflow);
      setReceipt(null);
      setState("ready");
      setMessage("Completed test receipt confirmed for this draft. Review the step once more before publishing.");
    } catch {
      setState("error");
      setMessage("The completed test receipt was not confirmed. This draft remains unpublished.");
    }
  }

  async function loadReceiptHistory() {
    if (!historyWorkflowId) return;
    setHistoryState("loading");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${historyWorkflowId}/run-receipts`, { credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (response.status === 401) return setState("signed-out");
      if (!response.ok || !isReceiptHistory(body)) throw new Error("History was not confirmed.");
      setReceiptHistory(body.receipts);
      setMessage(body.receipts.length ? "Saved receipt history loaded from the selected workflow." : "No saved receipts yet for the selected workflow.");
    } catch {
      setMessage("Receipt history could not be verified. No local receipt was uploaded.");
    } finally {
      setHistoryState("idle");
    }
  }

  async function loadRunHealth() {
    const workflow = workflows.find((item) => item.id === healthWorkflowId);
    if (!workflow?.activeVersion) return;
    setHealthState("loading");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${workflow.id}/run-health?version=${workflow.activeVersion}`, { credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (response.status === 401) return setState("signed-out");
      if (!response.ok || !isRunHealthResponse(body) || body.health.workflowVersion !== workflow.activeVersion) throw new Error("Run health was not confirmed.");
      setRunHealth(body.health);
      setMessage(`Recent manual-run health loaded for version ${body.health.workflowVersion}.`);
    } catch {
      setMessage("Run health could not be verified. Scheduling remains unavailable.");
    } finally {
      setHealthState("idle");
    }
  }

  async function loadAuditHistory() {
    if (!auditWorkflowId) return;
    setAuditState("loading");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${auditWorkflowId}/audit-events`, { credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (response.status === 401) return setState("signed-out");
      if (!response.ok || !isWorkflowAuditHistory(body)) throw new Error("Audit history was not confirmed.");
      setAuditEvents(body.events);
      setMessage(body.events.length ? "Workflow history loaded from the selected workflow." : "No lifecycle events are available for the selected workflow.");
    } catch {
      setMessage("Workflow history could not be verified.");
    } finally {
      setAuditState("idle");
    }
  }

  async function disableActiveWorkflow() {
    if (!canDisable) {
      setMessage("Only an owner can disable an active workflow.");
      return;
    }
    if (!disableWorkflowId || !window.confirm("Disable this workflow immediately? It will stop accepting new runs, and you can create a new reviewed version later.")) return;
    setDisableState("disabling");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${disableWorkflowId}/disable`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (response.status === 401) return setState("signed-out");
      if (!response.ok || !isDisableResponse(body) || body.workflowId !== disableWorkflowId) throw new Error("Workflow was not disabled.");
      setWorkflows((current) => current.map((workflow) => workflow.id === disableWorkflowId ? { ...workflow, activeVersion: null, updatedAt: new Date().toISOString() } : workflow));
      setReceiptWorkflowId((current) => current === disableWorkflowId ? "" : current);
      setHistoryWorkflowId((current) => current === disableWorkflowId ? "" : current);
      setDisableWorkflowId("");
      setMessage(`Workflow version ${body.disabledVersion} was disabled immediately. Its audit history remains available.`);
    } catch {
      setMessage("This workflow could not be disabled. It may already be inactive, or your role does not allow it.");
    } finally {
      setDisableState("idle");
    }
  }

  async function createRepairDraft() {
    if (!repairWorkflowId) return;
    if (!canAuthor) {
      setMessage("Your workspace role can inspect workflows but cannot create repair drafts.");
      return;
    }
    if (!workflowChangesEnabled) {
      setMessage("Workflow changes are paused by the server safety control. The existing workflow was not changed.");
      return;
    }
    setRepairState("creating");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${repairWorkflowId}/repair-draft`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (response.status === 401) return setState("signed-out");
      if (!response.ok || !isRepairDraftResponse(body)) throw new Error("Repair draft was not confirmed.");
      setDraft(body.workflow);
      setPreviewState("idle");
      setWorkflows((current) => current.map((workflow) => workflow.id === body.workflow.id ? { ...workflow, draftVersion: body.workflow.version, updatedAt: new Date().toISOString() } : workflow));
      setResumeDraftId(body.workflow.id);
      setRepairWorkflowId("");
      setMessage(`Repair draft version ${body.workflow.version} created. Reconfirm its safe step, run a fresh policy preview, then publish only if you approve it.`);
    } catch {
      setMessage("The repair draft was not confirmed. The existing workflow was not changed or enabled.");
    } finally {
      setRepairState("idle");
    }
  }

  async function submitSupportReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedWorkflow = workflows.find((workflow) => workflow.id === supportWorkflowId);
    if (includeSupportRunHealth && !selectedWorkflow?.activeVersion) {
      setMessage("Choose an active workflow before including its redacted run-health summary.");
      return;
    }
    setSupportState("sending");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/support-reports`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ category: supportCategory, ...(includeSupportRunHealth && selectedWorkflow?.activeVersion ? { includeRunHealth: true, workflowId: selectedWorkflow.id, workflowVersion: selectedWorkflow.activeVersion } : {}) }) });
      const body: unknown = await response.json();
      if (response.status === 401) return setState("signed-out");
      if (response.status === 429) {
        setMessage("You have sent several reports recently. Please wait a minute before trying again; no additional report was created.");
        return;
      }
      if (!response.ok || !isSupportReportResponse(body)) throw new Error("Support report was not accepted.");
      setMessage(`Problem report received. Reference ${body.report.id.slice(0, 8)} was recorded${body.report.diagnosticIncluded ? " with a server-derived run-health summary" : ""}, without page content or sensitive values.`);
    } catch {
      setMessage("Your problem report could not be sent. No browser content or sensitive values were uploaded.");
    } finally {
      setSupportState("idle");
    }
  }

  if (state === "loading") return <section className="workflow-panel" aria-live="polite"><p className="eyebrow">Workflow catalog</p><h2>Checking your workspace…</h2></section>;
  if (state === "signed-out") return <section className="workflow-panel"><p className="eyebrow">Workflow catalog</p><h2>Sign in to view a workspace.</h2><p>Workflow drafts are never shown until the server confirms your tenant session.</p><Link className="primary-link" href="/sign-up">Create workspace or sign in</Link></section>;
  if (state === "unavailable") return <section className="workflow-panel workflow-panel--error" role="alert"><p className="eyebrow">Workflow catalog</p><h2>Workspace service unavailable.</h2><p>No workflow details are shown while the account or workflow service cannot be verified.</p><button onClick={() => { setState("loading"); setLoadAttempt((current) => current + 1); }} type="button">Retry workspace check</button></section>;

  return (
    <section className="workflow-panel" aria-labelledby="workflow-title">
      <div className="workflow-heading">
        <div><p className="eyebrow">Workflow catalog</p><h2 id="workflow-title">Start with one reviewed template.</h2></div>
        <button className="workflow-create" disabled={!workflowChangesEnabled || !canAuthor || state === "creating" || state === "publishing"} onClick={() => void createSafeDraft()} type="button">{state === "creating" ? "Creating draft…" : "Create report-download draft"}</button>
      </div>
      <p className="workflow-copy">The only template available in this phase downloads a report from the DoOnce demo domain. It cannot submit, delete, pay, enter credentials, or run on another domain.</p>
      {role && <p className="workflow-role" role="status"><strong>{role[0].toUpperCase() + role.slice(1)} access.</strong> {role === "owner" ? "You can create, test, publish, repair, and immediately disable workflows." : role === "builder" ? "You can create, test, publish, and repair drafts. Only an owner can disable an active workflow." : role === "runner" ? "You can inspect workflows and save local run receipts. Workflow changes require an owner or builder." : "You can inspect workflows, receipts, and audit history. Workflow changes and receipt imports require another role."}</p>}
      {!workflowChangesEnabled && <div className="workflow-review workflow-review--restricted" role="alert"><strong>Workflow changes paused</strong><span>The server safety control is active.</span><small>You can inspect workflows, receipts, and audit history. Creating, publishing, and repairing drafts is unavailable; owners can still disable an active workflow.</small></div>}
      <label className="workflow-import">Import a local capture for review<input type="file" accept="application/json" onChange={(event) => void importCapture(event.target.files?.[0])} /><small>Optional. This reads a local extension export in your browser; it is not uploaded until you create a draft.</small></label>
      <label className="workflow-import">Import a local run receipt<input type="file" accept="application/json" onChange={(event) => void importReceipt(event.target.files?.[0])} /><small>Receipts remain local until you select an active workflow and confirm saving.</small></label>
      {workflows.some((workflow) => workflow.draftVersion !== null) && <div className="workflow-review" aria-label="Resume an unpublished draft"><strong>Resume an unpublished draft</strong><label>Saved draft<select value={resumeDraftId} onChange={(event) => setResumeDraftId(event.target.value)}><option value="">Choose a saved draft</option>{workflows.filter((workflow) => workflow.draftVersion !== null).map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title} — version {workflow.draftVersion}</option>)}</select></label><small>Restores the server-confirmed draft and its publication prerequisites. It does not run or publish anything.</small><button disabled={!resumeDraftId || resumeState === "loading"} onClick={() => void resumeDraft()} type="button">{resumeState === "loading" ? "Restoring draft…" : "Resume draft review"}</button></div>}
      <form className="workflow-review workflow-support" aria-label="Report a problem" onSubmit={(event) => void submitSupportReport(event)}>
        <strong>Report a problem</strong>
        <label>Issue category<select value={supportCategory} onChange={(event) => setSupportCategory(event.target.value as SupportReportCategory)}>{supportReportCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
        <label>Optional active workflow<select value={supportWorkflowId} onChange={(event) => { setSupportWorkflowId(event.target.value); if (!event.target.value) setIncludeSupportRunHealth(false); }}><option value="">Do not include run health</option>{workflows.filter((workflow) => workflow.activeVersion).map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label>
        <label><input checked={includeSupportRunHealth} disabled={!supportWorkflowId} onChange={(event) => setIncludeSupportRunHealth(event.target.checked)} type="checkbox" /> Include its server-derived run-health summary</label>
        <small>Only the selected category and, if you opt in, aggregate receipt counts and stable pause codes are sent. Never page content, selectors, passwords, OTPs, screenshots, or receipt IDs.</small>
        <button disabled={supportState === "sending"} type="submit">{supportState === "sending" ? "Sending report…" : "Send private report"}</button>
      </form>
      <div className="workflow-review workflow-review--danger" aria-label="Emergency workflow disable">
        <strong>Disable an active workflow</strong>
        <label>Active workflow<select value={disableWorkflowId} onChange={(event) => setDisableWorkflowId(event.target.value)}><option value="">Choose an active workflow</option>{workflows.filter((workflow) => workflow.activeVersion).map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label>
        <small>Owners can stop one workflow immediately. Its version and audit history are retained.</small>
        <button disabled={!canDisable || !disableWorkflowId || disableState === "disabling"} onClick={() => void disableActiveWorkflow()} type="button">{disableState === "disabling" ? "Disabling workflow…" : "Disable immediately"}</button>
      </div>
      <div className="workflow-review workflow-review--repair" aria-label="Create a reviewed repair draft">
        <strong>Review required: repair a workflow</strong>
        <label>Workflow to repair<select value={repairWorkflowId} onChange={(event) => setRepairWorkflowId(event.target.value)}><option value="">Choose a workflow</option>{workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label>
        <small>Creates the next version as a draft from the approved safe step. It does not change or enable the existing workflow.</small>
        <button disabled={!workflowChangesEnabled || !canAuthor || !repairWorkflowId || repairState === "creating"} onClick={() => void createRepairDraft()} type="button">{repairState === "creating" ? "Creating repair draft…" : "Create repair draft"}</button>
      </div>
      <div className="workflow-review" aria-label="Workflow version history">
        <strong>Review workflow history</strong>
        <label>Workflow<select value={auditWorkflowId} onChange={(event) => { setAuditWorkflowId(event.target.value); setAuditEvents(null); }}><option value="">Choose a workflow</option>{workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label>
        <button disabled={!auditWorkflowId || auditState === "loading"} onClick={() => void loadAuditHistory()} type="button">{auditState === "loading" ? "Loading historyâ€¦" : "Load workflow history"}</button>
        {auditEvents && (auditEvents.length ? <ol className="workflow-list">{auditEvents.map((event) => <li key={event.id}><span><strong>{event.eventType.replace("workflow.", "").replaceAll("_", " ")}</strong><small>Version {event.version} Â· {new Date(event.createdAt).toLocaleString()}</small></span><b>Recorded</b></li>)}</ol> : <p className="workflow-empty">No lifecycle history for this workflow yet.</p>)}
      </div>
      {receipt && draft && <div className="workflow-review" aria-label="Confirm completed draft test"><strong>Test receipt ready for this draft</strong><span>{receipt.outcome} · {new Date(receipt.finishedAt).toLocaleString()}</span><small>{receipt.outcome === "completed" ? "Confirm this completed local receipt to unlock publication for the current draft version." : "Paused receipts are retained locally but cannot unlock publication. Run the reviewed draft again before publishing."}</small><button className="workflow-create" disabled={!canImportRunReceipts || receipt.outcome !== "completed" || state === "creating"} onClick={() => void confirmDraftTestReceipt()} type="button">{state === "creating" ? "Confirming test…" : "Confirm completed draft test"}</button></div>}
      {receipt && !draft && <div className="workflow-review"><strong>Receipt ready for confirmation</strong><span>{receipt.outcome} · {new Date(receipt.finishedAt).toLocaleString()}</span><label>Active workflow<select value={receiptWorkflowId} onChange={(event) => setReceiptWorkflowId(event.target.value)}><option value="">Choose an active workflow</option>{workflows.filter((workflow) => workflow.activeVersion).map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label><button className="workflow-create" disabled={!canImportRunReceipts || !receiptWorkflowId || state === "creating"} onClick={() => void saveReceipt()} type="button">Save confirmed receipt</button></div>}
      <div className="workflow-review" aria-label="Saved run receipt history">
        <strong>Review saved receipts</strong>
        <label>Active workflow<select value={historyWorkflowId} onChange={(event) => { setHistoryWorkflowId(event.target.value); setReceiptHistory(null); }}><option value="">Choose an active workflow</option>{workflows.filter((workflow) => workflow.activeVersion).map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label>
        <button disabled={!historyWorkflowId || historyState === "loading"} onClick={() => void loadReceiptHistory()} type="button">{historyState === "loading" ? "Loading receipts…" : "Load saved receipts"}</button>
        {receiptHistory && (receiptHistory.length ? <ul className="workflow-list">{receiptHistory.map((savedReceipt) => <li key={savedReceipt.id}><span><strong>{savedReceipt.outcome === "completed" ? "Verified completion" : "Paused safely"}</strong><small>Version {savedReceipt.workflowVersion} · {new Date(savedReceipt.finishedAt).toLocaleString()}{savedReceipt.pauseReason ? ` · ${savedReceipt.pauseReason}` : ""}</small></span><b>{savedReceipt.outcome}</b></li>)}</ul> : <p className="workflow-empty">No saved receipts for this active workflow yet.</p>)}
      </div>
      <div className="workflow-review workflow-review--health" aria-label="Manual-run reliability evidence">
        <strong>Review manual-run reliability</strong>
        <label>Active workflow<select value={healthWorkflowId} onChange={(event) => { setHealthWorkflowId(event.target.value); setRunHealth(null); }}><option value="">Choose an active workflow</option>{workflows.filter((workflow) => workflow.activeVersion).map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label>
        <small>Counts only the recent 50 receipts for the selected active version. This is evidence for review, not a scheduling switch.</small>
        <button disabled={!healthWorkflowId || healthState === "loading"} onClick={() => void loadRunHealth()} type="button">{healthState === "loading" ? "Loading reliability…" : "Load reliability"}</button>
        {runHealth && <div className="workflow-review-details"><p><b>{runHealth.successRate}% verified</b> · {runHealth.completedRuns} completed, {runHealth.pausedRuns} paused, from {runHealth.sampleSize}/50 recent manual runs.</p><p>{runHealth.meetsManualReliabilityThreshold ? "The 50-run / 90% manual reliability threshold is met. Scheduling remains disabled until a separate review." : "The 50-run / 90% manual reliability threshold is not met. Scheduling remains unavailable."}</p>{Object.keys(runHealth.pauseReasons).length > 0 && <p>Pause reasons: {Object.entries(runHealth.pauseReasons).map(([reason, count]) => `${reason} (${count})`).join(", ")}.</p>}</div>}
      </div>
      <form className="workflow-form" onSubmit={(event) => void createSafeDraft(event)}>
        <label>Workflow name<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required /></label>
        <label>Approved domain<input value={domain} onChange={(event) => setDomain(event.target.value)} inputMode="url" autoCapitalize="none" maxLength={253} required /></label>
        <label>Report path<input value={path} onChange={(event) => setPath(event.target.value)} maxLength={2048} required /></label>
        <small>This pilot creates runnable drafts only for the local demo at <code>localhost</code> or <code>127.0.0.1</code> with <code>/demo/reports</code>.</small>
        <button className="workflow-create" disabled={!workflowChangesEnabled || !canAuthor || state === "creating" || state === "publishing"} type="submit">{state === "creating" ? "Creating draft…" : "Create reviewed draft"}</button>
      </form>
      {draft && <aside className="workflow-review" aria-label="Draft review"><strong>Server-confirmed draft · version {draft.version}</strong><span>{draft.title}</span><div className="workflow-review-details"><p><b>Approved domain:</b> {draft.allowedDomains.join(", ")}</p><ol>{draft.steps.map((step) => <li key={step.id}><b>{step.kind}</b> — {step.name}<small>{step.domain}{step.path} · {step.expectedOutcome}</small></li>)}</ol><p>{previewState === "passed" ? "Policy preview passed." : "Run a server policy preview before publishing."}</p><p>{draft.testRunVerified ? "A completed local test receipt is confirmed for this version." : "Import and confirm one completed local test receipt before publishing."}</p></div><div className="workflow-review-actions"><button disabled={!canAuthor || previewState === "running" || state === "publishing"} onClick={() => void previewDraft()} type="button">{previewState === "running" ? "Checking policy…" : "Run policy preview"}</button><button disabled={!workflowChangesEnabled || !canAuthor || previewState !== "passed" || !draft.testRunVerified || state === "publishing"} onClick={() => void publishDraft()} type="button">Publish reviewed draft</button></div></aside>}
      {auditWorkflowId && <a className="workflow-review-link" download href={`${apiBaseUrl}/api/v1/workflows/${auditWorkflowId}/audit-events/export`}>Download selected audit JSON</a>}
      <p className="workflow-feedback" aria-live="polite" data-state={state}>{message}</p>
      {workflows.length === 0 ? <p className="workflow-empty">No workflows yet. The safe report-download template is ready when you are.</p> : <ul className="workflow-list">{workflows.map((workflow) => <li key={workflow.id}><span><strong>{workflow.title}</strong><small>{workflow.activeVersion ? `Active version ${workflow.activeVersion}` : "Not active"}</small></span><b>{workflow.activeVersion ? "Active" : "Not active"}</b></li>)}</ul>}
    </section>
  );
}
