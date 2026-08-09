"use client";

import { useState } from "react";
import type { WorkflowSummary } from "./authoring-types";

const taskCategories = ["report-download", "filter-export", "structured-form-entry", "table-extraction", "copy-fields", "bounded-condition"] as const;
const failureCategories = ["compiler-problem", "locator-problem", "editor-confusion", "executor-limitation", "website-incompatibility", "verification-gap", "infrastructure-problem"] as const;
const observationStages = ["first-test", "first-production", "repeat-production"] as const;

interface BetaWorkflow {
  id: string; workflowId: string; taskCategory: string; baselineDurationSeconds: number; baselineErrorRatePercent: number;
  status: "onboarding" | "active" | "paused" | "graduated"; firstTestObserved: boolean; firstProductionObserved: boolean;
  repeatUnassistedRuns: number; productionRuns: number; successfulProductionRuns: number; productionSuccessRate: number; classifiedFailures: number;
}
interface BetaSummary {
  enrolledWorkflows: number; workflowsWithFirstTest: number; workflowsWithFirstProduction: number;
  workflowsReadyForIndependentUse: number; totalRepeatUnassistedRuns: number; topFailureCategories: Array<{ category: string; count: number }>;
}
interface Compatibility {
  reviewedAt: string; runtimes: Array<{ runtime: string; channel: string; execution: string; status: string }>;
  workflowCategories: Array<{ category: string; status: string }>; constraints: string[];
}

export function BetaEvidencePanel({ apiBaseUrl, workflows }: { apiBaseUrl: string; workflows: WorkflowSummary[] }) {
  const [items, setItems] = useState<BetaWorkflow[]>([]);
  const [summary, setSummary] = useState<BetaSummary | null>(null);
  const [compatibility, setCompatibility] = useState<Compatibility | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ workflowId: "", taskCategory: "report-download", baselineDurationMinutes: "", baselineErrorRatePercent: "0" });

  async function load() {
    setState("loading");
    try {
      const [workflowsResponse, summaryResponse, compatibilityResponse] = await Promise.all([
        request(`${apiBaseUrl}/api/v1/beta/workflows`),
        request(`${apiBaseUrl}/api/v1/beta/summary`),
        request(`${apiBaseUrl}/api/v1/beta/compatibility`),
      ]);
      if (!isBetaWorkflowsResponse(workflowsResponse) || !isBetaSummaryResponse(summaryResponse) || !isCompatibilityResponse(compatibilityResponse)) throw new Error("Beta evidence returned an invalid response.");
      setItems(workflowsResponse.workflows); setSummary(summaryResponse.summary); setCompatibility(compatibilityResponse.compatibility); setState("ready");
    } catch { setState("unavailable"); }
  }

  async function enroll() {
    setMessage("Recording the manual baseline…");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/beta/workflows`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...form, baselineDurationMinutes: Number(form.baselineDurationMinutes), baselineErrorRatePercent: Number(form.baselineErrorRatePercent) }),
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(readError(body));
      setForm({ workflowId: "", taskCategory: "report-download", baselineDurationMinutes: "", baselineErrorRatePercent: "0" });
      setMessage("Workflow enrolled. Observe its first test and production run next.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The workflow could not be enrolled."); }
  }

  return (
    <details className="beta-evidence" onToggle={(event) => { if (event.currentTarget.open && state === "idle") void load(); }}>
      <summary><span><strong>Controlled beta evidence</strong><small>Measure repeat use before expanding the product.</small></span><b>{summary?.workflowsReadyForIndependentUse ?? "Beta"}</b></summary>
      <div className="beta-evidence__body">
        {state === "loading" && <p aria-live="polite">Loading beta evidence…</p>}
        {state === "unavailable" && <div className="beta-evidence__notice" role="alert"><p>Beta tracking is unavailable. Existing workflows are unaffected.</p><button className="secondary-button" onClick={() => void load()} type="button">Try again</button></div>}
        {state === "ready" && summary && <>
          <div className="beta-evidence__metrics" aria-label="Controlled beta totals">
            <div><strong>{summary.enrolledWorkflows}</strong><span>Enrolled</span></div>
            <div><strong>{summary.workflowsWithFirstProduction}</strong><span>First real run</span></div>
            <div><strong>{summary.totalRepeatUnassistedRuns}</strong><span>Repeat unassisted</span></div>
            <div><strong>{summary.workflowsReadyForIndependentUse}</strong><span>Independent-ready</span></div>
          </div>
          <section className="beta-enroll" aria-labelledby="beta-enroll-title">
            <div><p className="eyebrow">Manual baseline</p><h3 id="beta-enroll-title">Enroll a measurable browser task</h3><p>Use the time and error rate from doing the same task manually.</p></div>
            <div className="beta-enroll__form">
              <label><span>Workflow</span><select value={form.workflowId} onChange={(event) => setForm((current) => ({ ...current, workflowId: event.target.value }))}><option value="">Choose workflow</option>{workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.title}</option>)}</select></label>
              <label><span>Task type</span><select value={form.taskCategory} onChange={(event) => setForm((current) => ({ ...current, taskCategory: event.target.value }))}>{taskCategories.map((category) => <option key={category} value={category}>{label(category)}</option>)}</select></label>
              <label><span>Manual minutes</span><input min="0.02" max="1440" step="0.1" type="number" value={form.baselineDurationMinutes} onChange={(event) => setForm((current) => ({ ...current, baselineDurationMinutes: event.target.value }))} /></label>
              <label><span>Manual error rate %</span><input min="0" max="100" step="0.1" type="number" value={form.baselineErrorRatePercent} onChange={(event) => setForm((current) => ({ ...current, baselineErrorRatePercent: event.target.value }))} /></label>
            </div>
            <button className="primary-button" disabled={!form.workflowId || !(Number(form.baselineDurationMinutes) > 0)} onClick={() => void enroll()} type="button">Enroll workflow</button>
          </section>
          <div className="beta-workflows">
            {items.length === 0 ? <p>No workflows are enrolled yet.</p> : items.map((item) => <BetaWorkflowCard key={item.id} apiBaseUrl={apiBaseUrl} item={item} onChanged={load} />)}
          </div>
          <details className="beta-compatibility"><summary>Supported beta matrix</summary>{compatibility && <div><p>Reviewed {new Date(compatibility.reviewedAt).toLocaleDateString()}.</p><ul>{compatibility.runtimes.map((runtime) => <li key={runtime.runtime}><strong>{runtime.runtime}</strong> — {runtime.status}; {runtime.execution} on {runtime.channel}</li>)}</ul><ul>{compatibility.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul></div>}</details>
          {summary.topFailureCategories.length > 0 && <p className="beta-failures"><strong>Top failure categories:</strong> {summary.topFailureCategories.map((item) => `${label(item.category)} (${item.count})`).join(", ")}</p>}
        </>}
        <p className="library-message" role="status">{message}</p>
      </div>
    </details>
  );
}

function BetaWorkflowCard({ apiBaseUrl, item, onChanged }: { apiBaseUrl: string; item: BetaWorkflow; onChanged(): Promise<void> }) {
  const [runId, setRunId] = useState(""); const [stage, setStage] = useState("first-test"); const [intervened, setIntervened] = useState(false);
  const [failure, setFailure] = useState("locator-problem"); const [errorCode, setErrorCode] = useState(""); const [message, setMessage] = useState("");
  async function post(path: "observations" | "failures", body: Record<string, unknown>) {
    try { const response = await fetch(`${apiBaseUrl}/api/v1/beta/workflows/${item.id}/${path}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) }); const value: unknown = await response.json(); if (!response.ok) throw new Error(readError(value)); setMessage("Evidence recorded."); setRunId(""); setErrorCode(""); await onChanged(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Evidence could not be recorded."); }
  }
  return <article className="beta-workflow" data-status={item.status}><header><div><strong>{label(item.taskCategory)}</strong><small>{item.productionSuccessRate}% production success · {item.productionRuns} runs</small></div><span>{item.status}</span></header><div className="beta-workflow__steps"><span data-complete={item.firstTestObserved}>First test</span><span data-complete={item.firstProductionObserved}>First real run</span><span data-complete={item.repeatUnassistedRuns >= 3}>{item.repeatUnassistedRuns}/3 repeat runs</span></div><details><summary>Record observed evidence</summary><div className="beta-observation-form"><label><span>Run ID</span><input value={runId} onChange={(event) => setRunId(event.target.value)} placeholder="Run identifier" /></label><label><span>Stage</span><select value={stage} onChange={(event) => setStage(event.target.value)}>{observationStages.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label><label className="beta-checkbox"><input checked={intervened} onChange={(event) => setIntervened(event.target.checked)} type="checkbox" /> Developer intervened</label><button className="secondary-button" disabled={!runId} onClick={() => void post("observations", { runId, stage, developerIntervened: intervened })} type="button">Record run</button><label><span>Failure category</span><select value={failure} onChange={(event) => setFailure(event.target.value)}>{failureCategories.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label><label><span>Stable error code <small>Optional</small></span><input value={errorCode} onChange={(event) => setErrorCode(event.target.value)} placeholder="locator.ambiguous" /></label><button className="secondary-button" onClick={() => void post("failures", { category: failure, ...(runId ? { runId } : {}), ...(errorCode ? { errorCode } : {}) })} type="button">Classify failure</button></div></details><p className="library-message" role="status">{message}</p></article>;
}

async function request(url: string): Promise<unknown> { const response = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } }); const body: unknown = await response.json(); if (!response.ok) throw new Error(readError(body)); return body; }
function label(value: string): string { return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function readError(value: unknown): string { return value && typeof value === "object" && typeof (value as { error?: unknown }).error === "string" ? (value as { error: string }).error : "Request failed."; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
export function isBetaWorkflowsResponse(value: unknown): value is { workflows: BetaWorkflow[] } { return isRecord(value) && Array.isArray(value.workflows) && value.workflows.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.workflowId === "string" && typeof item.productionRuns === "number" && typeof item.repeatUnassistedRuns === "number"); }
export function isBetaSummaryResponse(value: unknown): value is { summary: BetaSummary } { if (!isRecord(value) || !isRecord(value.summary)) return false; const summary = value.summary; return ["enrolledWorkflows", "workflowsWithFirstTest", "workflowsWithFirstProduction", "workflowsReadyForIndependentUse", "totalRepeatUnassistedRuns"].every((key) => typeof summary[key] === "number") && Array.isArray(summary.topFailureCategories); }
export function isCompatibilityResponse(value: unknown): value is { compatibility: Compatibility } { return isRecord(value) && isRecord(value.compatibility) && typeof value.compatibility.reviewedAt === "string" && Array.isArray(value.compatibility.runtimes) && Array.isArray(value.compatibility.workflowCategories) && Array.isArray(value.compatibility.constraints); }
