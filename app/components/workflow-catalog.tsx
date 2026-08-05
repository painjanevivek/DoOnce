"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

type CatalogState = "loading" | "ready" | "signed-out" | "unavailable" | "creating" | "publishing" | "error";
type Workflow = { id: string; title: string; activeVersion: number | null; updatedAt: string };
type WorkflowVersion = { id: string; title: string; version: number };

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

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

export default function WorkflowCatalog() {
  const [state, setState] = useState<CatalogState>("loading");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [draft, setDraft] = useState<WorkflowVersion | null>(null);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("Download weekly sales report");
  const [domain, setDomain] = useState("reports.example.test");
  const [path, setPath] = useState("/weekly-report");

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
    if (!title.trim() || !/^(?:[a-z0-9-]+\.)+[a-z]{2,63}$/.test(normalizedDomain) || !normalizedPath.startsWith("/") || normalizedPath.startsWith("//")) {
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
      setDraft(body.workflow);
      setWorkflows((current) => [{ id: body.workflow.id, title: body.workflow.title, activeVersion: null, updatedAt: new Date().toISOString() }, ...current]);
      setState("ready");
      setMessage("Safe report-download draft created. Review it before publishing.");
    } catch {
      setState("error");
      setMessage("The draft was not confirmed. No workflow was enabled.");
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
      <form className="workflow-form" onSubmit={(event) => void createSafeDraft(event)}>
        <label>Workflow name<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required /></label>
        <label>Approved domain<input value={domain} onChange={(event) => setDomain(event.target.value)} inputMode="url" autoCapitalize="none" maxLength={253} required /></label>
        <label>Report path<input value={path} onChange={(event) => setPath(event.target.value)} maxLength={2048} required /></label>
        <button className="workflow-create" disabled={state === "creating" || state === "publishing"} type="submit">{state === "creating" ? "Creating draft…" : "Create reviewed draft"}</button>
      </form>
      {draft && <aside className="workflow-review" aria-label="Draft review"><strong>Draft ready for review</strong><span>{draft.title}</span><button disabled={state === "publishing"} onClick={() => void publishDraft()} type="button">{state === "publishing" ? "Publishing…" : "Publish reviewed draft"}</button></aside>}
      <p className="workflow-feedback" aria-live="polite" data-state={state}>{message}</p>
      {workflows.length === 0 ? <p className="workflow-empty">No workflows yet. The safe report-download template is ready when you are.</p> : <ul className="workflow-list">{workflows.map((workflow) => <li key={workflow.id}><span><strong>{workflow.title}</strong><small>{workflow.activeVersion ? `Active version ${workflow.activeVersion}` : "Draft"}</small></span><b>{workflow.activeVersion ? "Active" : "Draft"}</b></li>)}</ul>}
    </section>
  );
}
