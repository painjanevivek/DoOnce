"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

type CatalogState = "loading" | "ready" | "signed-out" | "unavailable" | "creating" | "publishing" | "error";
type Workflow = { id: string; title: string; activeVersion: number | null; updatedAt: string };
type WorkflowVersion = { id: string; title: string; version: number };
type WorkflowReview = WorkflowVersion & { status: "draft"; allowedDomains: string[]; steps: Array<{ id: string; kind: string; name: string; expectedOutcome: string; domain: string; path: string }> };
type SafeCaptureSummary = { origin: string; path?: string; eventKind: "click" | "change" | "input"; selector: string };
type PauseReason = "changed-page" | "slow-network" | "unknown";
type LocalReceipt = { id: string; origin: string; outcome: "completed" | "paused"; pauseReason?: PauseReason; finishedAt: string };
type StoredReceipt = { id: string; outcome: "completed" | "paused"; pauseReason?: PauseReason; workflowVersion: number; finishedAt: string };
type WorkflowAuditEvent = { id: string; version: number; eventType: "workflow.draft_created" | "workflow.policy_previewed" | "workflow.published"; createdAt: string };

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

function isValidWorkflowDomain(value: string): boolean {
  return value === "localhost" || value === "127.0.0.1" || /^(?:[a-z0-9-]+\.)+[a-z]{2,63}$/.test(value);
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
  return typeof record.id === "string" && typeof record.title === "string" && (typeof record.activeVersion === "number" || record.activeVersion === null) && typeof record.updatedAt === "string";
}

function isWorkflowList(value: unknown): value is { workflows: Workflow[] } {
  return typeof value === "object" && value !== null && Array.isArray((value as Record<string, unknown>).workflows) && (value as { workflows: unknown[] }).workflows.every(isWorkflow);
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
  return workflow.status === "draft" && Array.isArray(workflow.allowedDomains) && workflow.allowedDomains.every((domain) => typeof domain === "string") && Array.isArray(workflow.steps) && workflow.steps.every((step) => typeof step === "object" && step !== null && typeof (step as Record<string, unknown>).name === "string" && typeof (step as Record<string, unknown>).domain === "string" && typeof (step as Record<string, unknown>).path === "string");
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

function isWorkflowAuditHistory(value: unknown): value is { events: WorkflowAuditEvent[] } {
  if (typeof value !== "object" || value === null || !Array.isArray((value as Record<string, unknown>).events)) return false;
  return (value as { events: unknown[] }).events.every((event) => {
    if (typeof event !== "object" || event === null) return false;
    const item = event as Record<string, unknown>;
    return isUuid(item.id) && typeof item.version === "number" && Number.isInteger(item.version) && item.version > 0 && ["workflow.draft_created", "workflow.policy_previewed", "workflow.published", "workflow.disabled"].includes(item.eventType as string) && isTimestamp(item.createdAt);
  });
}

function isDisableResponse(value: unknown): value is { workflowId: string; disabledVersion: number } {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return isUuid(record.workflowId) && typeof record.disabledVersion === "number" && Number.isInteger(record.disabledVersion) && record.disabledVersion > 0;
}

export default function WorkflowCatalog() {
  const [state, setState] = useState<CatalogState>("loading");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [draft, setDraft] = useState<WorkflowReview | null>(null);
  const [message, setMessage] = useState("");
  const [previewState, setPreviewState] = useState<"idle" | "running" | "passed">("idle");
  const [title, setTitle] = useState("Download weekly sales report");
  const [domain, setDomain] = useState("reports.example.test");
  const [path, setPath] = useState("/weekly-report");
  const [receipt, setReceipt] = useState<LocalReceipt | null>(null);
  const [receiptWorkflowId, setReceiptWorkflowId] = useState("");
  const [historyWorkflowId, setHistoryWorkflowId] = useState("");
  const [receiptHistory, setReceiptHistory] = useState<StoredReceipt[] | null>(null);
  const [historyState, setHistoryState] = useState<"idle" | "loading">("idle");
  const [auditWorkflowId, setAuditWorkflowId] = useState("");
  const [auditEvents, setAuditEvents] = useState<WorkflowAuditEvent[] | null>(null);
  const [auditState, setAuditState] = useState<"idle" | "loading">("idle");
  const [disableWorkflowId, setDisableWorkflowId] = useState("");
  const [disableState, setDisableState] = useState<"idle" | "disabling">("idle");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/workflows`, { credentials: "include", headers: { Accept: "application/json" }, signal: controller.signal });
        if (response.status === 401) return setState("signed-out");
        const body: unknown = await response.json();
        if (!response.ok || !isWorkflowList(body)) return setState("unavailable");
        setWorkflows(body.workflows);
        setState("ready");
      } catch {
        if (!controller.signal.aborted) setState("unavailable");
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  async function createSafeDraft(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const normalizedDomain = domain.trim().toLowerCase();
    const normalizedPath = path.trim();
    if (!title.trim() || !isValidWorkflowDomain(normalizedDomain) || !normalizedPath.startsWith("/") || normalizedPath.startsWith("//")) {
      setState("error");
      setMessage("Enter a title, a valid domain, and a path beginning with one slash.");
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
      setWorkflows((current) => [{ id: body.workflow.id, title: body.workflow.title, activeVersion: null, updatedAt: new Date().toISOString() }, ...current]);
      setState("ready");
      setMessage("Safe report-download draft created. Review it before publishing.");
    } catch {
      setState("error");
      setMessage("The draft was not confirmed. No workflow was enabled.");
    }
  }

  async function previewDraft() {
    if (!draft) return;
    setPreviewState("running");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${draft.id}/preview`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (!response.ok || !isWorkflowReviewResponse(body) || (body as { preview?: unknown }).preview !== "policy-passed") throw new Error("Preview was not confirmed.");
      setPreviewState("passed");
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
        setMessage(`${payload.summaries.length} local, value-free event summaries imported. This capture is review-only until it matches a supported workflow pattern.`);
      }
    } catch {
      setState("error");
      setMessage("That file is not a valid DoOnce local capture export.");
    }
  }

  async function publishDraft() {
    if (!draft) return;
    setState("publishing");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${draft.id}/publish`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (!response.ok || !isWorkflowVersionResponse(body)) throw new Error("Publication was not confirmed.");
      setWorkflows((current) => current.map((workflow) => workflow.id === body.workflow.id ? { ...workflow, activeVersion: body.workflow.version } : workflow));
      setDraft(null);
      setState("ready");
      setMessage("Workflow published. It remains limited to the approved report-download step.");
    } catch {
      setState("error");
      setMessage("Publication was not confirmed. The workflow remains a draft or was not created.");
    }
  }

  async function importReceipt(file: File | undefined) {
    if (!file || file.size > 128_000) return setMessage("Choose a small local receipt file.");
    try {
      const payload: unknown = JSON.parse(await file.text());
      if (!isLocalReceiptFile(payload)) throw new Error("Invalid receipt.");
      const latest = payload.receipts.at(-1)!;
      setReceipt(latest);
      setMessage(`Local ${latest.outcome} receipt ready for explicit dashboard confirmation.`);
    } catch { setState("error"); setMessage("That file is not a valid local receipt export."); }
  }

  async function saveReceipt() {
    if (!receipt || !receiptWorkflowId) return;
    setState("creating");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflows/${receiptWorkflowId}/run-receipts/import`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ sourceId: receipt.id, outcome: receipt.outcome, ...(receipt.pauseReason ? { pauseReason: receipt.pauseReason } : {}) }) });
      if (response.status === 409) { setReceipt(null); setState("ready"); setMessage("This receipt was already saved to a workflow."); return; }
      if (!response.ok) throw new Error("Not confirmed");
      setReceipt(null); setState("ready"); setMessage("Receipt saved to the selected active workflow.");
    } catch { setState("error"); setMessage("Receipt was not confirmed. Nothing was saved."); }
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

  if (state === "loading") return <section className="workflow-panel" aria-live="polite"><p className="eyebrow">Workflow catalog</p><h2>Checking your workspace…</h2></section>;
  if (state === "signed-out") return <section className="workflow-panel"><p className="eyebrow">Workflow catalog</p><h2>Sign in to view a workspace.</h2><p>Workflow drafts are never shown until the server confirms your tenant session.</p><Link className="primary-link" href="/sign-up">Create workspace or sign in</Link></section>;
  if (state === "unavailable") return <section className="workflow-panel workflow-panel--error" role="alert"><p className="eyebrow">Workflow catalog</p><h2>Workspace service unavailable.</h2><p>No workflow details are shown while the account or workflow service cannot be verified.</p></section>;

  return (
    <section className="workflow-panel" aria-labelledby="workflow-title">
      <div className="workflow-heading">
        <div><p className="eyebrow">Workflow catalog</p><h2 id="workflow-title">Start with one reviewed template.</h2></div>
        <button className="workflow-create" disabled={state === "creating" || state === "publishing"} onClick={() => void createSafeDraft()} type="button">{state === "creating" ? "Creating draft…" : "Create report-download draft"}</button>
      </div>
      <p className="workflow-copy">The only template available in this phase downloads a report from the DoOnce demo domain. It cannot submit, delete, pay, enter credentials, or run on another domain.</p>
      <label className="workflow-import">Import a local capture for review<input type="file" accept="application/json" onChange={(event) => void importCapture(event.target.files?.[0])} /><small>Optional. This reads a local extension export in your browser; it is not uploaded until you create a draft.</small></label>
      <label className="workflow-import">Import a local run receipt<input type="file" accept="application/json" onChange={(event) => void importReceipt(event.target.files?.[0])} /><small>Receipts remain local until you select an active workflow and confirm saving.</small></label>
      <div className="workflow-review workflow-review--danger" aria-label="Emergency workflow disable">
        <strong>Disable an active workflow</strong>
        <label>Active workflow<select value={disableWorkflowId} onChange={(event) => setDisableWorkflowId(event.target.value)}><option value="">Choose an active workflow</option>{workflows.filter((workflow) => workflow.activeVersion).map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label>
        <small>Owners can stop one workflow immediately. Its version and audit history are retained.</small>
        <button disabled={!disableWorkflowId || disableState === "disabling"} onClick={() => void disableActiveWorkflow()} type="button">{disableState === "disabling" ? "Disabling workflow…" : "Disable immediately"}</button>
      </div>
      <div className="workflow-review" aria-label="Workflow version history">
        <strong>Review workflow history</strong>
        <label>Workflow<select value={auditWorkflowId} onChange={(event) => { setAuditWorkflowId(event.target.value); setAuditEvents(null); }}><option value="">Choose a workflow</option>{workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label>
        <button disabled={!auditWorkflowId || auditState === "loading"} onClick={() => void loadAuditHistory()} type="button">{auditState === "loading" ? "Loading historyâ€¦" : "Load workflow history"}</button>
        {auditEvents && (auditEvents.length ? <ol className="workflow-list">{auditEvents.map((event) => <li key={event.id}><span><strong>{event.eventType.replace("workflow.", "").replaceAll("_", " ")}</strong><small>Version {event.version} Â· {new Date(event.createdAt).toLocaleString()}</small></span><b>Recorded</b></li>)}</ol> : <p className="workflow-empty">No lifecycle history for this workflow yet.</p>)}
      </div>
      {receipt && <div className="workflow-review"><strong>Receipt ready for confirmation</strong><span>{receipt.outcome} · {new Date(receipt.finishedAt).toLocaleString()}</span><label>Active workflow<select value={receiptWorkflowId} onChange={(event) => setReceiptWorkflowId(event.target.value)}><option value="">Choose an active workflow</option>{workflows.filter((workflow) => workflow.activeVersion).map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label><button className="workflow-create" disabled={!receiptWorkflowId || state === "creating"} onClick={() => void saveReceipt()} type="button">Save confirmed receipt</button></div>}
      <div className="workflow-review" aria-label="Saved run receipt history">
        <strong>Review saved receipts</strong>
        <label>Active workflow<select value={historyWorkflowId} onChange={(event) => { setHistoryWorkflowId(event.target.value); setReceiptHistory(null); }}><option value="">Choose an active workflow</option>{workflows.filter((workflow) => workflow.activeVersion).map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label>
        <button disabled={!historyWorkflowId || historyState === "loading"} onClick={() => void loadReceiptHistory()} type="button">{historyState === "loading" ? "Loading receipts…" : "Load saved receipts"}</button>
        {receiptHistory && (receiptHistory.length ? <ul className="workflow-list">{receiptHistory.map((savedReceipt) => <li key={savedReceipt.id}><span><strong>{savedReceipt.outcome === "completed" ? "Verified completion" : "Paused safely"}</strong><small>Version {savedReceipt.workflowVersion} · {new Date(savedReceipt.finishedAt).toLocaleString()}{savedReceipt.pauseReason ? ` · ${savedReceipt.pauseReason}` : ""}</small></span><b>{savedReceipt.outcome}</b></li>)}</ul> : <p className="workflow-empty">No saved receipts for this active workflow yet.</p>)}
      </div>
      <form className="workflow-form" onSubmit={(event) => void createSafeDraft(event)}>
        <label>Workflow name<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required /></label>
        <label>Approved domain<input value={domain} onChange={(event) => setDomain(event.target.value)} inputMode="url" autoCapitalize="none" maxLength={253} required /></label>
        <label>Report path<input value={path} onChange={(event) => setPath(event.target.value)} maxLength={2048} required /></label>
        <button className="workflow-create" disabled={state === "creating" || state === "publishing"} type="submit">{state === "creating" ? "Creating draft…" : "Create reviewed draft"}</button>
      </form>
      {draft && <aside className="workflow-review" aria-label="Draft review"><strong>Server-confirmed draft · version {draft.version}</strong><span>{draft.title}</span><div className="workflow-review-details"><p><b>Approved domain:</b> {draft.allowedDomains.join(", ")}</p><ol>{draft.steps.map((step) => <li key={step.id}><b>{step.kind}</b> — {step.name}<small>{step.domain}{step.path} · {step.expectedOutcome}</small></li>)}</ol><p>{previewState === "passed" ? "Policy preview passed." : "Run a server policy preview before publishing."}</p></div><div className="workflow-review-actions"><button disabled={previewState === "running" || state === "publishing"} onClick={() => void previewDraft()} type="button">{previewState === "running" ? "Checking policy…" : "Run policy preview"}</button><button disabled={previewState !== "passed" || state === "publishing"} onClick={() => void publishDraft()} type="button">Publish reviewed draft</button></div></aside>}
      <p className="workflow-feedback" aria-live="polite" data-state={state}>{message}</p>
      {workflows.length === 0 ? <p className="workflow-empty">No workflows yet. The safe report-download template is ready when you are.</p> : <ul className="workflow-list">{workflows.map((workflow) => <li key={workflow.id}><span><strong>{workflow.title}</strong><small>{workflow.activeVersion ? `Active version ${workflow.activeVersion}` : "Draft"}</small></span><b>{workflow.activeVersion ? "Active" : "Draft"}</b></li>)}</ul>}
    </section>
  );
}
