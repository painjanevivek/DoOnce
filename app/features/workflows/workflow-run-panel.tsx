"use client";

import { useEffect, useState } from "react";
import type { WorkflowSpec } from "../../../contracts/protocol";
import type { WorkflowSummary, WorkflowVersion } from "./authoring-types";
import { WorkflowSchedulePanel } from "./workflow-schedule-panel";

interface RunView {
  id: string;
  status: "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
  executor?: "extension" | "hosted-browser";
  currentStepIndex: number;
  cancelRequested: boolean;
  result?: { reasonCode?: string };
}

export function WorkflowRunPanel({ apiBaseUrl, workflow, onClose }: { apiBaseUrl: string; workflow: WorkflowSummary; onClose(): void }) {
  const [spec, setSpec] = useState<WorkflowSpec | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [run, setRun] = useState<RunView | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "starting" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${apiBaseUrl}/api/v1/workflow-specs/${workflow.id}/versions`, { credentials: "include", headers: { Accept: "application/json" }, signal: controller.signal })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok || !isVersions(body)) throw new Error("Published workflow details are unavailable.");
        const active = body.versions.find((version) => version.status === "active" && version.version === workflow.activeVersion);
        if (!active) throw new Error("This workflow has no active version.");
        setSpec(active.spec);
        setInputs(Object.fromEntries(active.spec.inputs.flatMap((input) => input.defaultValue === undefined ? [] : [[input.name, input.defaultValue]])));
        setState("ready");
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setState("error");
          setMessage(error instanceof Error ? error.message : "Run setup failed.");
        }
      });
    return () => controller.abort();
  }, [apiBaseUrl, workflow]);

  useEffect(() => {
    if (!run || terminalStatus(run.status)) return;
    const timer = window.setInterval(() => {
      void fetch(`${apiBaseUrl}/api/v1/runs/${run.id}`, { credentials: "include", headers: { Accept: "application/json" } })
        .then(async (response) => {
          const body: unknown = await response.json();
          if (response.ok && isRunResponse(body)) setRun(body.run);
        });
    }, 2_000);
    return () => window.clearInterval(timer);
  }, [apiBaseUrl, run]);

  async function start() {
    setState("starting");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/runs`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ workflowId: workflow.id, inputs, idempotencyKey: `dashboard:${crypto.randomUUID()}`, triggerKind: "manual", sessionLocation: "user-browser" }),
      });
      const body: unknown = await response.json();
      if (!response.ok || !isCreatedRun(body)) throw new Error(readError(body));
      setRun(body.run);
      setMessage("Run queued. Keep Chrome open on an approved workflow page; the connected extension will claim it automatically.");
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The run could not be queued.");
      setState("error");
    }
  }

  async function cancel() {
    if (!run) return;
    const response = await fetch(`${apiBaseUrl}/api/v1/runs/${run.id}/cancel`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } });
    const body: unknown = await response.json();
    if (response.ok && isRunResponse(body)) setRun(body.run);
  }

  const terminal = run ? terminalStatus(run.status) : false;
  return (
    <section className="run-launcher" aria-labelledby="run-launcher-title">
      <div className="studio-section__heading"><div><p className="eyebrow">Attended extension run</p><h2 id="run-launcher-title">Run {workflow.title}</h2><p>The dashboard queues one immutable published version. The extension executes deterministic steps in your open Chrome tab and checkpoints after every verified action.</p></div><button className="text-button" onClick={onClose} type="button">Close</button></div>
      {state === "loading" && <p aria-busy="true">Loading published inputs...</p>}
      {spec && <>
        <div className="test-inputs">{spec.inputs.map((input) => <label key={input.name}><span>{input.label}{input.required ? " *" : ""}</span>{input.kind === "select" ? <select value={inputs[input.name] ?? ""} onChange={(event) => setInputs((current) => ({ ...current, [input.name]: event.target.value }))}><option value="">Choose...</option>{input.options?.map((option) => <option key={option}>{option}</option>)}</select> : <input type={input.secret ? "password" : input.kind === "date" ? "date" : "text"} value={inputs[input.name] ?? ""} onChange={(event) => setInputs((current) => ({ ...current, [input.name]: event.target.value }))} />}</label>)}</div>
        <div className="run-launcher__actions"><button className="primary-button" disabled={state === "starting" || Boolean(run && !terminal)} onClick={() => void start()} type="button">{state === "starting" ? "Queueing run..." : terminal ? "Run again" : "Queue extension run"}</button>{run && !terminal && <button className="secondary-button" onClick={() => void cancel()} type="button">Cancel run</button>}</div>
        <WorkflowSchedulePanel apiBaseUrl={apiBaseUrl} inputs={inputs} workflowId={workflow.id} />
      </>}
      {run && <div className="run-progress" data-status={run.status}><span>{run.executor === "hosted-browser" ? "Hosted" : "Extension"} run {run.id.slice(0, 8)}</span><strong>{run.status}</strong><small>{run.currentStepIndex} step{run.currentStepIndex === 1 ? "" : "s"} checkpointed{run.result?.reasonCode ? ` - ${run.result.reasonCode}` : ""}</small></div>}
      <p className="test-message" role="status">{message}</p>
    </section>
  );
}

function terminalStatus(status: RunView["status"]): boolean { return ["completed", "paused", "failed", "cancelled"].includes(status); }
function isVersions(value: unknown): value is { versions: WorkflowVersion[] } { return Boolean(value && typeof value === "object" && Array.isArray((value as { versions?: unknown }).versions)); }
function isRun(value: unknown): value is RunView { return Boolean(value && typeof value === "object" && typeof (value as RunView).id === "string" && ["queued", "running", "paused", "completed", "failed", "cancelled"].includes((value as RunView).status)); }
function isRunResponse(value: unknown): value is { run: RunView } { return Boolean(value && typeof value === "object" && isRun((value as { run?: unknown }).run)); }
function isCreatedRun(value: unknown): value is { created: boolean; run: RunView } { return Boolean(value && typeof value === "object" && typeof (value as { created?: unknown }).created === "boolean" && isRun((value as { run?: unknown }).run)); }
function readError(value: unknown): string { return value && typeof value === "object" && typeof (value as { error?: unknown }).error === "string" ? (value as { error: string }).error : "The run request failed."; }
