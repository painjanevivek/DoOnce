"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type JobStatus = "queued" | "running" | "needs-input" | "completed" | "failed" | "cancelled";
interface AuthoringJob {
  id: string; status: JobStatus; provider: string; model: string; promptVersion: string; progress: { phase: string; message: string };
  attempts: number; validationRetries: number; usage: { promptTokens: number; completionTokens: number; estimatedCostMicrousd: number }; latencyMs: number;
  workflowId?: string; errorCode?: string; result?: { questions: string[]; assumptions: string[]; unsupportedRequirements: string[]; stepConfidence: Array<{ stepId: string; confidence: number; rationale: string }> };
}

export function TextAuthoringPanel({ apiBaseUrl, onDraftCreated }: { apiBaseUrl: string; onDraftCreated(): void }) {
  const [taskDescription, setTaskDescription] = useState("");
  const [startingUrl, setStartingUrl] = useState("");
  const [inputLines, setInputLines] = useState("");
  const [job, setJob] = useState<AuthoringJob | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!job || !["queued", "running"].includes(job.status)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/authoring-jobs/${job.id}`, { credentials: "include", headers: { Accept: "application/json" }, signal: controller.signal });
        const body: unknown = await response.json();
        if (!response.ok || !isJobResponse(body)) { setMessage("Authoring progress is temporarily unavailable; polling will resume."); setJob((current) => current ? { ...current } : current); return; }
        setJob(body.job);
        if (body.job.status === "completed") { setMessage("Editable draft created. Review every step before testing it."); onDraftCreated(); }
        else if (body.job.status === "needs-input") setMessage("The authoring job needs more information before it can create a draft.");
        else if (body.job.status === "failed") setMessage("No draft was stored because the candidate did not pass validation.");
      } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) { setMessage("Authoring progress is temporarily unavailable; polling will resume."); setJob((current) => current ? { ...current } : current); } }
    }, 1_500);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [apiBaseUrl, job, onDraftCreated]);

  async function submit() {
    setSubmitting(true); setMessage(""); setJob(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/authoring-jobs`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ taskDescription, ...(startingUrl.trim() ? { startingUrl: startingUrl.trim() } : {}), availableInputs: parseInputs(inputLines), idempotencyKey: `text:${crypto.randomUUID()}` }) });
      const body: unknown = await response.json();
      if (!response.ok || !isQueuedResponse(body)) throw new Error(readError(body));
      setJob(body.job); setMessage("Task accepted. You can leave this section open while the draft is prepared.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The task could not be submitted."); }
    finally { setSubmitting(false); }
  }

  async function cancel() {
    if (!job) return;
    const response = await fetch(`${apiBaseUrl}/api/v1/authoring-jobs/${job.id}/cancel`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } });
    const body: unknown = await response.json();
    if (response.ok && isJobResponse(body)) { setJob(body.job); setMessage(body.job.status === "cancelled" ? "Authoring cancelled. No workflow was created." : "The authoring job had already finished."); }
  }

  const busy = submitting || Boolean(job && ["queued", "running"].includes(job.status));
  return <details className="text-authoring"><summary><span><strong>Create from a description</strong><small>Describe one browser task and receive an editable draft.</small></span><b>Text</b></summary><div className="text-authoring__body"><div className="text-authoring__intro"><p className="eyebrow">Text to workflow</p><h2>What should the browser do?</h2><p>Use a specific starting page and observable result. The generated workflow remains a draft until you review and test it.</p></div><label className="editor-field"><span>Task description</span><textarea maxLength={5000} placeholder="Example: Filter the weekly report by region, then export it as a CSV file." value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} /></label><label className="editor-field"><span>Starting page <small>Optional—the system will ask if it needs one</small></span><input maxLength={2048} placeholder="https://reports.example.com/reports" type="url" value={startingUrl} onChange={(event) => setStartingUrl(event.target.value)} /></label><details className="authoring-options"><summary>Reusable inputs and technical details</summary><label className="editor-field"><span>Reusable inputs <small>One per line: internal_name | Human label</small></span><textarea placeholder={"region | Region\nreport_date | Report date"} value={inputLines} onChange={(event) => setInputLines(event.target.value)} /></label><p>The extension runtime and WorkflowSpec v1 schema are selected automatically. Provider usage is bounded per workspace.</p></details><div className="run-launcher__actions"><button className="primary-button" disabled={busy || taskDescription.trim().length < 10} onClick={() => void submit()} type="button">{submitting ? "Submitting…" : busy ? "Creating draft…" : "Create editable draft"}</button>{busy && <button className="secondary-button" onClick={() => void cancel()} type="button">Cancel</button>}</div>{job && <AuthoringProgress job={job} />}<p className="library-message" role="status">{message}</p></div></details>;
}

function AuthoringProgress({ job }: { job: AuthoringJob }) {
  const result = job.result;
  return <div className="authoring-progress" data-status={job.status}><header><span>{job.progress.phase.replace("-", " ")}</span><strong>{job.status.replace("-", " ")}</strong></header><p>{job.progress.message}</p>{job.workflowId && <Link className="primary-link" href={`/workflows/${job.workflowId}`}>Review generated draft</Link>}{result && (result.questions.length > 0 || result.unsupportedRequirements.length > 0 || result.assumptions.length > 0) && <div className="authoring-findings">{result.questions.length > 0 && <Finding title="Questions" items={result.questions} />}{result.unsupportedRequirements.length > 0 && <Finding title="Current limitations" items={result.unsupportedRequirements} />}{result.assumptions.length > 0 && <Finding title="Assumptions to review" items={result.assumptions} />}</div>}{result && result.stepConfidence.length > 0 && <details className="authoring-confidence"><summary>Step confidence ({result.stepConfidence.length})</summary><ol>{result.stepConfidence.map((item, index) => <li key={item.stepId}><span>Step {index + 1}</span><strong>{Math.round(item.confidence * 100)}%</strong><small>{item.rationale}</small></li>)}</ol></details>}<details className="authoring-metrics"><summary>Provider details</summary><dl><div><dt>Provider</dt><dd>{job.provider}</dd></div><div><dt>Model</dt><dd>{job.model}</dd></div><div><dt>Prompt</dt><dd>{job.promptVersion}</dd></div><div><dt>Validation retries</dt><dd>{job.validationRetries}</dd></div><div><dt>Tokens</dt><dd>{job.usage.promptTokens + job.usage.completionTokens}</dd></div><div><dt>Latency</dt><dd>{job.latencyMs} ms</dd></div></dl></details></div>;
}
function Finding({ title, items }: { title: string; items: string[] }) { return <section><strong>{title}</strong><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>; }
function parseInputs(value: string) { return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 50).map((line, index) => { const [rawName, rawLabel] = line.split("|").map((part) => part.trim()); const fallback = `input_${index + 1}`; const name = (rawName || fallback).toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^[^a-z]+/, "").slice(0, 64) || fallback; return { name, label: (rawLabel || rawName || `Input ${index + 1}`).slice(0, 120), kind: "text", required: true }; }); }
function isJob(value: unknown): value is AuthoringJob { if (!value || typeof value !== "object") return false; const job = value as Partial<AuthoringJob>; return typeof job.id === "string" && ["queued", "running", "needs-input", "completed", "failed", "cancelled"].includes(job.status ?? "") && typeof job.provider === "string" && typeof job.model === "string" && typeof job.promptVersion === "string" && Boolean(job.progress && typeof job.progress.phase === "string" && typeof job.progress.message === "string") && isBoundedNumber(job.attempts) && isBoundedNumber(job.validationRetries) && isBoundedNumber(job.latencyMs) && Boolean(job.usage && isBoundedNumber(job.usage.promptTokens) && isBoundedNumber(job.usage.completionTokens) && isBoundedNumber(job.usage.estimatedCostMicrousd)) && (job.result === undefined || isResult(job.result)); }
function isResult(value: unknown): value is NonNullable<AuthoringJob["result"]> { if (!value || typeof value !== "object") return false; const result = value as NonNullable<AuthoringJob["result"]>; return isStringList(result.questions) && isStringList(result.assumptions) && isStringList(result.unsupportedRequirements) && Array.isArray(result.stepConfidence) && result.stepConfidence.length <= 500 && result.stepConfidence.every((item) => Boolean(item && typeof item.stepId === "string" && item.stepId.length <= 200 && typeof item.rationale === "string" && item.rationale.length <= 1000 && typeof item.confidence === "number" && Number.isFinite(item.confidence) && item.confidence >= 0 && item.confidence <= 1)); }
function isStringList(value: unknown): value is string[] { return Array.isArray(value) && value.length <= 50 && value.every((item) => typeof item === "string" && item.length <= 1000); }
function isBoundedNumber(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 100_000_000_000; }
function isQueuedResponse(value: unknown): value is { created: boolean; job: AuthoringJob } { return Boolean(value && typeof value === "object" && typeof (value as { created?: unknown }).created === "boolean" && isJob((value as { job?: unknown }).job)); }
function isJobResponse(value: unknown): value is { job: AuthoringJob } { return Boolean(value && typeof value === "object" && isJob((value as { job?: unknown }).job)); }
function readError(value: unknown): string { return value && typeof value === "object" && typeof (value as { error?: unknown }).error === "string" ? (value as { error: string }).error : "Text authoring is unavailable."; }
