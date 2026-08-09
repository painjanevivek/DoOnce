"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { WorkflowSummary } from "./authoring-types";
import { CapturePairingPanel } from "./capture-pairing-panel";
import { CaptureSessionInbox } from "./capture-session-inbox";
import { RunHistoryPanel } from "./run-history-panel";
import { TextAuthoringPanel } from "./text-authoring-panel";
import { VideoAuthoringPanel } from "./video-authoring-panel";
import { WorkflowRunPanel } from "./workflow-run-panel";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

export default function WorkflowLibrary() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [state, setState] = useState<
    "loading" | "ready" | "signed-out" | "error"
  >("loading");
  const [message, setMessage] = useState("");
  const [selectedRun, setSelectedRun] = useState<WorkflowSummary | null>(null);
  const load = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflow-specs`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const body: unknown = await response.json();
      if (response.status === 401) return setState("signed-out");
      if (!response.ok || !isWorkflowList(body))
        throw new Error("Workflow list unavailable.");
      setWorkflows(body.workflows);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function openEditor(workflow: WorkflowSummary) {
    if (workflow.draftVersion) return router.push(`/workflows/${workflow.id}`);
    setMessage("Creating a new draft version…");
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/workflow-specs/${workflow.id}/next-draft`,
        {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
        },
      );
      const body: unknown = await response.json();
      if (
        !response.ok ||
        !body ||
        typeof body !== "object" ||
        !("workflow" in body)
      )
        throw new Error(readError(body));
      router.push(`/workflows/${workflow.id}`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "A new draft could not be created.",
      );
    }
  }

  if (state === "loading")
    return (
      <section className="library" aria-busy="true">
        <div className="library-hero">
          <p className="eyebrow">Workflow library</p>
          <h1>Your reusable work</h1>
        </div>
        <div className="library-skeleton" aria-label="Loading workflows">
          <i />
          <i />
          <i />
        </div>
      </section>
    );
  if (state === "signed-out")
    return (
      <section className="library-state">
        <p className="eyebrow">Workflow library</p>
        <h1>Sign in to open your workspace.</h1>
        <Link className="primary-link" href="/sign-up">
          Sign in or create a workspace
        </Link>
      </section>
    );
  if (state === "error")
    return (
      <section className="library-state" role="alert">
        <p className="eyebrow">Workflow library</p>
        <h1>The workflow service is unavailable.</h1>
        <p>Your drafts were not changed.</p>
        <button
          className="primary-button"
          onClick={() => void load()}
          type="button"
        >
          Try again
        </button>
      </section>
    );

  return (
    <section className="library">
      <div className="library-hero">
        <div>
          <p className="eyebrow">Workflow library</p>
          <h1>Your reusable work</h1>
          <p>
            Record a task, review the generated draft, then publish a version
            you understand.
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={() => void load()}
          type="button"
        >
          Refresh
        </button>
      </div>
      <div className="library-metrics" aria-label="Workflow totals">
        <div>
          <strong>{workflows.length}</strong>
          <span>Total workflows</span>
        </div>
        <div>
          <strong>
            {
              workflows.filter((workflow) => workflow.status === "active")
                .length
            }
          </strong>
          <span>Active</span>
        </div>
        <div>
          <strong>
            {workflows.filter((workflow) => workflow.draftVersion).length}
          </strong>
          <span>Need review</span>
        </div>
      </div>
      <TextAuthoringPanel apiBaseUrl={apiBaseUrl} onDraftCreated={load} />
      <VideoAuthoringPanel apiBaseUrl={apiBaseUrl} onDraftCreated={load} />
      <CapturePairingPanel />
      <CaptureSessionInbox />
      <RunHistoryPanel apiBaseUrl={apiBaseUrl} />
      {selectedRun && (
        <WorkflowRunPanel
          apiBaseUrl={apiBaseUrl}
          onClose={() => setSelectedRun(null)}
          workflow={selectedRun}
        />
      )}
      {workflows.length === 0 ? (
        <div className="studio-empty">
          <strong>No workflow drafts yet</strong>
          <p>
            Record a browser task above. Finalized recordings can be compiled
            into an editable draft.
          </p>
        </div>
      ) : (
        <div className="workflow-table-wrap">
          <table className="workflow-table">
            <caption>
              Canonical WorkflowSpec drafts and published versions
            </caption>
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Status</th>
                <th>Last run</th>
                <th>Success rate</th>
                <th>Version</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow) => (
                <tr key={workflow.id}>
                  <td>
                    <strong>{workflow.title}</strong>
                    <small>
                      Updated {new Date(workflow.updatedAt).toLocaleString()}
                    </small>
                  </td>
                  <td>
                    <span className="status-pill" data-status={workflow.status}>
                      {workflow.status}
                    </span>
                  </td>
                  <td>
                    {workflow.lastRunAt
                      ? new Date(workflow.lastRunAt).toLocaleDateString()
                      : "Not run"}
                  </td>
                  <td>
                    {workflow.successRate === null
                      ? "—"
                      : `${workflow.successRate}%`}
                  </td>
                  <td>
                    {workflow.draftVersion
                      ? `Draft v${workflow.draftVersion}`
                      : workflow.activeVersion
                        ? `Active v${workflow.activeVersion}`
                        : "Archived"}
                  </td>
                  <td>
                    <div className="table-actions">
                      {workflow.activeVersion && (
                        <button
                          className="table-action table-action--run"
                          onClick={() => setSelectedRun(workflow)}
                          type="button"
                        >
                          Run
                        </button>
                      )}
                      <button
                        className="table-action"
                        onClick={() => void openEditor(workflow)}
                        type="button"
                      >
                        {workflow.draftVersion
                          ? "Continue editing"
                          : "Create new version"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="library-message" role="status">
        {message}
      </p>
    </section>
  );
}

function isWorkflowList(
  value: unknown,
): value is { workflows: WorkflowSummary[] } {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as { workflows?: unknown }).workflows)
  )
    return false;
  return (value as { workflows: unknown[] }).workflows.every((item) => {
    if (!item || typeof item !== "object") return false;
    const workflow = item as Partial<WorkflowSummary>;
    return (
      typeof workflow.id === "string" &&
      typeof workflow.title === "string" &&
      (workflow.activeVersion === null ||
        typeof workflow.activeVersion === "number") &&
      (workflow.draftVersion === null ||
        typeof workflow.draftVersion === "number") &&
      (workflow.status === "draft" ||
        workflow.status === "active" ||
        workflow.status === "archived") &&
      typeof workflow.updatedAt === "string" &&
      (workflow.lastRunAt === null || typeof workflow.lastRunAt === "string") &&
      (workflow.successRate === null ||
        typeof workflow.successRate === "number")
    );
  });
}
function readError(value: unknown): string {
  return value &&
    typeof value === "object" &&
    typeof (value as { error?: unknown }).error === "string"
    ? (value as { error: string }).error
    : "A new draft could not be created.";
}
