"use client";

import { useState } from "react";
import type { WorkflowSpec } from "../../../contracts/protocol";
import type { TestPreview } from "./authoring-types";

export function WorkflowTestPanel({ apiBaseUrl, workflowId, spec, disabled }: { apiBaseUrl: string; workflowId: string; spec: WorkflowSpec; disabled: boolean }) {
  const [executor, setExecutor] = useState<"extension" | "hosted-browser">("extension");
  const [inputs, setInputs] = useState<Record<string, string>>(() => Object.fromEntries(spec.inputs.flatMap((input) => input.defaultValue === undefined ? [] : [[input.name, input.defaultValue]])));
  const [preview, setPreview] = useState<TestPreview | null>(null);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);

  async function prepare() {
    setRunning(true); setMessage(""); setPreview(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflow-specs/${workflowId}/test-preview`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ executor, inputs }) });
      const body: unknown = await response.json();
      if (!response.ok || !isPreviewResponse(body)) throw new Error(readError(body));
      setPreview(body.preview);
      setMessage(executor === "extension" ? "Test plan is ready. Publish this version, then queue an attended extension run from the workflow library." : "Hosted-browser plan is ready. Hosted execution is intentionally unavailable until its runtime is deployed.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Test setup could not be verified."); }
    finally { setRunning(false); }
  }

  return <section className="studio-section test-panel" aria-labelledby="test-title">
    <div className="studio-section__heading"><div><p className="eyebrow">Test mode</p><h2 id="test-title">Prepare a controlled run</h2><p>Validate the exact input and step plan before publication. Published extension runs are queued from the workflow library.</p></div><label className="runtime-select"><span>Runtime</span><select value={executor} onChange={(event) => setExecutor(event.target.value as typeof executor)}><option value="extension">Local Chrome extension</option><option value="hosted-browser">Hosted browser</option></select></label></div>
    {spec.inputs.length > 0 && <div className="test-inputs">{spec.inputs.map((input) => <label key={input.name}><span>{input.label}{input.required ? " *" : ""}</span>{input.kind === "select" ? <select value={inputs[input.name] ?? ""} onChange={(event) => setInputs((current) => ({ ...current, [input.name]: event.target.value }))}><option value="">Choose…</option>{input.options?.map((option) => <option key={option}>{option}</option>)}</select> : <input type={input.secret ? "password" : input.kind === "date" ? "date" : "text"} value={inputs[input.name] ?? ""} onChange={(event) => setInputs((current) => ({ ...current, [input.name]: event.target.value }))} />}</label>)}</div>}
    <button className="primary-button" disabled={disabled || running} onClick={() => void prepare()} type="button">{running ? "Checking test plan…" : "Prepare test plan"}</button>
    <p className="test-message" role="status">{message}</p>
    {preview && <ol className="test-timeline">{preview.steps.map((step, index) => <li key={step.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.name}</strong><small>{step.message}</small></div><b data-readiness={step.readiness}>{step.readiness.replace("-", " ")}</b></li>)}</ol>}
  </section>;
}

function isPreviewResponse(value: unknown): value is { preview: TestPreview } {
  if (!value || typeof value !== "object") return false;
  const preview = (value as { preview?: unknown }).preview;
  if (!preview || typeof preview !== "object") return false;
  const candidate = preview as Partial<TestPreview>;
  return candidate.status === "ready" && typeof candidate.workflowId === "string" && typeof candidate.version === "number" && typeof candidate.checksum === "string" && (candidate.executor === "extension" || candidate.executor === "hosted-browser") && Array.isArray(candidate.inputs) && candidate.inputs.every((input) => typeof input.name === "string" && typeof input.provided === "boolean" && typeof input.secret === "boolean") && Array.isArray(candidate.steps) && candidate.steps.every((step) => typeof step.id === "string" && typeof step.name === "string" && typeof step.action === "string" && (step.readiness === "ready" || step.readiness === "approval-required" || step.readiness === "checkpoint") && typeof step.message === "string");
}
function readError(value: unknown): string { return value && typeof value === "object" && typeof (value as { error?: unknown }).error === "string" ? (value as { error: string }).error : "Test setup could not be verified."; }
