"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { WorkflowDraftReview } from "../features/workflows/workflow-draft-review";
import { WorkflowSpecPreview } from "../features/workflows/workflow-spec-preview";
import { WorkflowSummaryList } from "../features/workflows/workflow-summary-list";
import type { WorkflowSpec } from "../../contracts/protocol";

import {
  isCurrentUser,
  isDisableResponse,
  isDraftTestReceiptResponse,
  isLocalReceiptFile,
  isReceiptHistory,
  isRepairDraftResponse,
  isRunHealthResponse,
  isSupportReportResponse,
  isSupportedDemoCapture,
  isSupportedDemoTarget,
  isWorkflowAuditHistory,
  isWorkflowCapabilitiesSummary,
  isWorkflowList,
  isWorkflowReviewResponse,
  isWorkflowVersionResponse,
  parseCaptureImport,
  supportReportCategories,
  type CatalogState,
  type LocalReceipt,
  type MembershipRole,
  type RunHealth,
  type StoredReceipt,
  type SupportReportCategory,
  type Workflow,
  type WorkflowAuditEvent,
  type WorkflowReview,
} from "../features/workflows/contracts";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

export default function WorkflowCatalog() {
  const [state, setState] = useState<CatalogState>("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [workflowChangesEnabled, setWorkflowChangesEnabled] = useState(false);
  const [role, setRole] = useState<MembershipRole | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [draft, setDraft] = useState<WorkflowReview | null>(null);
  const [message, setMessage] = useState("");
  const [importedWorkflowSpec, setImportedWorkflowSpec] = useState<WorkflowSpec | null>(null);
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
        const [response, capabilitiesResponse, accountResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/v1/workflows`, { credentials: "include", headers: { Accept: "application/json" }, signal: controller.signal }),
          fetch(`${apiBaseUrl}/api/v1/system/capabilities`, { headers: { Accept: "application/json" }, signal: controller.signal }),
          fetch(`${apiBaseUrl}/api/v1/auth/me`, { credentials: "include", headers: { Accept: "application/json" }, signal: controller.signal }),
        ]);
        if (response.status === 401 || accountResponse.status === 401) return setState("signed-out");
        const [body, capabilities, account]: unknown[] = await Promise.all([response.json(), capabilitiesResponse.json(), accountResponse.json()]);
        if (!response.ok || !isWorkflowList(body) || !capabilitiesResponse.ok || !isWorkflowCapabilitiesSummary(capabilities) || !accountResponse.ok || !isCurrentUser(account)) return setState("unavailable");
        setWorkflows(body.workflows);
        setWorkflowChangesEnabled(capabilities.workflowChangesEnabled);
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

  async function createDraftFromCapture(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!canAuthor) {
      setState("error");
      setMessage("Your workspace role can inspect workflows but cannot create drafts.");
      return;
    }
    if (!workflowChangesEnabled) {
      setState("error");
      setMessage("Workflow changes are paused by the server capability control. Nothing was created.");
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
      if (response.status === 401) return setState("signed-out");
      if (!response.ok || !isWorkflowVersionResponse(body)) throw new Error("Draft was not confirmed.");
      const reviewResponse = await fetch(`${apiBaseUrl}/api/v1/workflows/${body.workflow.id}`, { credentials: "include", headers: { Accept: "application/json" } });
      const reviewBody: unknown = await reviewResponse.json();
      if (!reviewResponse.ok || !isWorkflowReviewResponse(reviewBody)) throw new Error("Draft review was not confirmed.");
      setDraft(reviewBody.workflow);
      setPreviewState("idle");
      setWorkflows((current) => [{ id: body.workflow.id, title: body.workflow.title, activeVersion: null, draftVersion: body.workflow.version, updatedAt: new Date().toISOString() }, ...current]);
      setState("ready");
      setMessage("Report-download draft created. Review it before publishing.");
    } catch {
      setState("error");
      setMessage("The draft was not confirmed. No workflow was enabled.");
    }
  }

  async function previewDraft() {
    if (!draft) return;
    if (!canAuthor) {
      setState("error");
      setMessage("Your workspace role cannot record a capability preview.");
      return;
    }
    if (!workflowChangesEnabled) {
      setState("error");
      setMessage("Workflow changes are paused by the server capability control. This draft was not previewed.");
      return;
    }
    setPreviewState("running");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${draft.id}/preview`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (response.status === 401) return setState("signed-out");
      if (!response.ok || !isWorkflowReviewResponse(body) || (body as { preview?: unknown }).preview !== "capabilities-passed") throw new Error("Preview was not confirmed.");
      setDraft(body.workflow);
      setPreviewState(body.workflow.capabilitiesPreviewed ? "passed" : "idle");
      setMessage("Capability preview passed. Review the saved steps once more before publishing.");
    } catch {
      setPreviewState("idle");
      setState("error");
      setMessage("Capability preview did not pass. Nothing was activated.");
    }
  }

  async function importCapture(file: File | undefined) {
    setImportedWorkflowSpec(null);
    if (!file || file.size > 128_000) return setMessage("Choose a small DoOnce local review file.");
    try {
      const payload: unknown = JSON.parse(await file.text());
      const capture = parseCaptureImport(payload);
      if (!capture) throw new Error("Invalid capture file.");
      setImportedWorkflowSpec(capture.workflowSpec ?? null);
      const origin = new URL(capture.actions[0]!.origin);
      if (!capture.actions.every((action) => action.origin === origin.origin) || (origin.protocol !== "https:" && origin.hostname !== "localhost" && origin.hostname !== "127.0.0.1")) throw new Error("Unapproved origin.");
      setDomain(origin.hostname);
      if (isSupportedDemoCapture(capture.actions)) {
        setTitle("Download captured weekly sales report");
        setPath("/demo/reports");
        setMessage(`${capture.migratedFromLegacy ? "Migrated the legacy capture and recognized" : "Recognized"} the local report-download pattern. Its domain and path are ready for review before creating a draft.`);
      } else {
        setTitle(`Review captured report from ${origin.hostname}`);
        setMessage(`${capture.actions.length} local, value-free event summaries imported. This capture is review-only and cannot create a runnable pilot draft until it matches the supported workflow pattern.`);
      }
    } catch {
      setImportedWorkflowSpec(null);
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
      setMessage("Workflow changes are paused by the server capability control. This draft remains unpublished.");
      return;
    }
    setState("publishing");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${draft.id}/publish`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (response.status === 401) return setState("signed-out");
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
      setPreviewState(body.workflow.capabilitiesPreviewed ? "passed" : "idle");
      setMessage(`Draft version ${body.workflow.version} restored. ${body.workflow.capabilitiesPreviewed ? "Its server capability preview remains recorded." : "Run its server capability preview before publishing."}`);
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
      if (response.status === 401) return setState("signed-out");
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
      if (response.status === 401) return setState("signed-out");
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
      setMessage("Workflow changes are paused by the server capability control. The existing workflow was not changed.");
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
      setMessage(`Repair draft version ${body.workflow.version} created. Reconfirm its step, run a fresh capability preview, then publish only if you approve it.`);
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
        <button className="workflow-create" disabled={!workflowChangesEnabled || !canAuthor || state === "creating" || state === "publishing"} onClick={() => void createDraftFromCapture()} type="button">{state === "creating" ? "Creating draft…" : "Create report-download draft"}</button>
      </div>
      <p className="workflow-copy">The only template available in this phase downloads a report from the DoOnce demo domain. It cannot submit, delete, pay, enter credentials, or run on another domain.</p>
      {role && <p className="workflow-role" role="status"><strong>{role[0].toUpperCase() + role.slice(1)} access.</strong> {role === "owner" ? "You can create, test, publish, repair, and immediately disable workflows." : role === "builder" ? "You can create, test, publish, and repair drafts. Only an owner can disable an active workflow." : role === "runner" ? "You can inspect workflows and save local run receipts. Workflow changes require an owner or builder." : "You can inspect workflows, receipts, and audit history. Workflow changes and receipt imports require another role."}</p>}
      {!workflowChangesEnabled && <div className="workflow-review workflow-review--restricted" role="alert"><strong>Workflow changes paused</strong><span>The server capability control is active.</span><small>You can inspect workflows, receipts, and audit history. Creating, previewing, publishing, and repairing drafts is unavailable; owners can still disable an active workflow.</small></div>}
      <label className="workflow-import">Import a local capture for review<input type="file" accept="application/json" onChange={(event) => void importCapture(event.target.files?.[0])} /><small>Optional. This reads a local extension export in your browser; it is not uploaded until you create a draft.</small></label>
      {importedWorkflowSpec && <WorkflowSpecPreview spec={importedWorkflowSpec} />}
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
        <small>Creates the next version as a draft from the approved step. It does not change or enable the existing workflow.</small>
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
        {receiptHistory && (receiptHistory.length ? <ul className="workflow-list">{receiptHistory.map((savedReceipt) => <li key={savedReceipt.id}><span><strong>{savedReceipt.outcome === "completed" ? "Verified completion" : "Paused run"}</strong><small>Version {savedReceipt.workflowVersion} · {new Date(savedReceipt.finishedAt).toLocaleString()}{savedReceipt.pauseReason ? ` · ${savedReceipt.pauseReason}` : ""}</small></span><b>{savedReceipt.outcome}</b></li>)}</ul> : <p className="workflow-empty">No saved receipts for this active workflow yet.</p>)}
      </div>
      <div className="workflow-review workflow-review--health" aria-label="Manual-run reliability evidence">
        <strong>Review manual-run reliability</strong>
        <label>Active workflow<select value={healthWorkflowId} onChange={(event) => { setHealthWorkflowId(event.target.value); setRunHealth(null); }}><option value="">Choose an active workflow</option>{workflows.filter((workflow) => workflow.activeVersion).map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label>
        <small>Counts only the recent 50 receipts for the selected active version. This is evidence for review, not a scheduling switch.</small>
        <button disabled={!healthWorkflowId || healthState === "loading"} onClick={() => void loadRunHealth()} type="button">{healthState === "loading" ? "Loading reliability…" : "Load reliability"}</button>
        {runHealth && <div className="workflow-review-details"><p><b>{runHealth.successRate}% verified</b> · {runHealth.completedRuns} completed, {runHealth.pausedRuns} paused, from {runHealth.sampleSize}/50 recent manual runs.</p><p>{runHealth.meetsManualReliabilityThreshold ? "The 50-run / 90% manual reliability threshold is met. Scheduling remains disabled until a separate review." : "The 50-run / 90% manual reliability threshold is not met. Scheduling remains unavailable."}</p>{Object.keys(runHealth.pauseReasons).length > 0 && <p>Pause reasons: {Object.entries(runHealth.pauseReasons).map(([reason, count]) => `${reason} (${count})`).join(", ")}.</p>}</div>}
      </div>
      <form className="workflow-form" onSubmit={(event) => void createDraftFromCapture(event)}>
        <label>Workflow name<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required /></label>
        <label>Approved domain<input value={domain} onChange={(event) => setDomain(event.target.value)} inputMode="url" autoCapitalize="none" maxLength={253} required /></label>
        <label>Report path<input value={path} onChange={(event) => setPath(event.target.value)} maxLength={2048} required /></label>
        <small>This pilot creates runnable drafts only for the local demo at <code>localhost</code> or <code>127.0.0.1</code> with <code>/demo/reports</code>.</small>
        <button className="workflow-create" disabled={!workflowChangesEnabled || !canAuthor || state === "creating" || state === "publishing"} type="submit">{state === "creating" ? "Creating draft…" : "Create reviewed draft"}</button>
      </form>
      {draft && <WorkflowDraftReview canAuthor={canAuthor} draft={draft} onPreview={() => void previewDraft()} onPublish={() => void publishDraft()} previewState={previewState} state={state} workflowChangesEnabled={workflowChangesEnabled} />}
      {auditWorkflowId && <a className="workflow-review-link" download href={`${apiBaseUrl}/api/v1/workflows/${auditWorkflowId}/audit-events/export`}>Download selected audit JSON</a>}
      <p className="workflow-feedback" aria-live="polite" data-state={state}>{message}</p>
      <WorkflowSummaryList workflows={workflows} />
    </section>
  );
}
