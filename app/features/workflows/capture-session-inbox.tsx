"use client";

import { useCallback, useEffect, useState } from "react";
import type { CaptureSessionSummary, WorkflowCompilation } from "../../../contracts/protocol";
import { validateContract } from "../../../contracts/validation";
import { WorkflowCompilationReview } from "./workflow-compilation-review";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

export function CaptureSessionInbox() {
  const [sessions, setSessions] = useState<CaptureSessionSummary[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [compilingId, setCompilingId] = useState<string | null>(null);
  const [compilation, setCompilation] = useState<WorkflowCompilation | null>(null);

  const load = useCallback(async () => {
    try {
      setSessions(await fetchCaptureSessions());
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchCaptureSessions().then((items) => {
      if (!active) return;
      setSessions(items);
      setState("ready");
    }).catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, []);

  async function compile(session: CaptureSessionSummary) {
    setCompilingId(session.id);
    setCompilation(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/capture-sessions/${session.id}/compile`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (!response.ok || !isCompilationResponse(body)) throw new TypeError("Compilation was not confirmed.");
      setCompilation(body.compilation);
      await load();
    } catch {
      setState("error");
    } finally {
      setCompilingId(null);
    }
  }

  return (
    <section className="workflow-capture-inbox" aria-labelledby="capture-inbox-title">
      <header>
        <div><p className="card-label">Recorder inbox</p><h3 id="capture-inbox-title">Synchronized recordings</h3></div>
        <button type="button" onClick={() => void load()} disabled={state === "loading"}>Refresh</button>
      </header>
      <p>Finalize a browser recording, then convert it into a deterministic draft here. The raw event stream stays available as evidence.</p>

      {state === "loading" && <p role="status">Loading recorder sessions…</p>}
      {state === "error" && <p role="alert">Recorder sessions could not be loaded or compiled. Confirm that you are signed in and the API is available.</p>}
      {state === "ready" && sessions.length === 0 && <p className="workflow-capture-empty">No synchronized recordings yet.</p>}
      {sessions.length > 0 && (
        <ul className="workflow-capture-list">
          {sessions.map((session) => (
            <li key={session.id}>
              <span><strong>{session.actionCount} recorded action{session.actionCount === 1 ? "" : "s"}</strong><small>{session.status} · {new Date(session.startedAt).toLocaleString()}</small></span>
              {session.workflowId
                ? <b>Draft created · v{session.compilerVersion}</b>
                : <button type="button" disabled={session.status !== "finalized" || compilingId !== null} onClick={() => void compile(session)}>{compilingId === session.id ? "Compiling…" : session.status === "finalized" ? "Create workflow draft" : "Finalize in extension"}</button>}
            </li>
          ))}
        </ul>
      )}

      {compilation && <WorkflowCompilationReview compilation={compilation} />}
    </section>
  );
}

function isSessionList(value: unknown): value is { sessions: CaptureSessionSummary[] } {
  if (!isRecord(value) || !Array.isArray(value.sessions) || value.sessions.length > 100) return false;
  return value.sessions.every((session) => validateContract<CaptureSessionSummary>("CaptureSessionSummary", session).ok);
}

async function fetchCaptureSessions(): Promise<CaptureSessionSummary[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/capture-sessions`, { credentials: "include", headers: { Accept: "application/json" } });
  const body: unknown = await response.json();
  if (!response.ok || !isSessionList(body)) throw new TypeError("Capture sessions were not confirmed.");
  return body.sessions;
}

function isCompilationResponse(value: unknown): value is { compilation: WorkflowCompilation } {
  return isRecord(value) && validateContract<WorkflowCompilation>("WorkflowCompilation", value.compilation).ok;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
