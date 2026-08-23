"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { WorkflowSummary } from "./authoring-types";

export type WorkflowLibraryState =
  | "loading"
  | "ready"
  | "signed-out"
  | "error";

export type AuthoringMode = "record" | "describe" | "video";

interface WorkflowLibraryViewProps {
  state: WorkflowLibraryState;
  workflows: WorkflowSummary[];
  message: string;
  activeMode: AuthoringMode;
  authoringPanels: Record<AuthoringMode, ReactNode>;
  operations: ReactNode;
  runDialog: ReactNode;
  onModeChange(mode: AuthoringMode): void;
  onRefresh(): void;
  onOpenWorkflow(workflow: WorkflowSummary): void;
  onRun(workflow: WorkflowSummary): void;
}

const authoringModes: Array<{
  id: AuthoringMode;
  label: string;
  summary: string;
}> = [
  {
    id: "record",
    label: "Show it in Chrome",
    summary: "Record one careful browser demonstration.",
  },
  {
    id: "describe",
    label: "Describe the task",
    summary: "Create an editable draft from plain language.",
  },
  {
    id: "video",
    label: "Upload a video",
    summary: "Calibrate an existing walkthrough before compilation.",
  },
];

export function WorkflowLibraryView({
  state,
  workflows,
  message,
  activeMode,
  authoringPanels,
  operations,
  runDialog,
  onModeChange,
  onRefresh,
  onOpenWorkflow,
  onRun,
}: WorkflowLibraryViewProps) {
  if (state === "loading") {
    return (
      <section className="product-state" aria-busy="true">
        <p className="product-kicker">Workflow library</p>
        <h1>Loading your reusable work.</h1>
        <div className="product-skeleton" aria-label="Loading workflows">
          <i />
          <i />
          <i />
        </div>
      </section>
    );
  }

  if (state === "signed-out") {
    return (
      <section className="product-state">
        <p className="product-kicker">Workflow library</p>
        <h1>Sign in to open your workspace.</h1>
        <p>Your browser workflows remain associated with their workspace.</p>
        <Link className="product-action" href="/sign-up">
          Sign in or create a workspace
        </Link>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="product-state" role="alert">
        <p className="product-kicker">Workflow library</p>
        <h1>The workflow service is unavailable.</h1>
        <p>Your drafts were not changed.</p>
        <button className="product-action" onClick={onRefresh} type="button">
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="workflow-library-view">
      <header className="library-commandbar">
        <div>
          <p className="product-kicker">Workflow library</p>
          <h1>Your reusable browser work.</h1>
          <p>
            Create a draft, inspect every step, then publish the version you
            want the runner to follow.
          </p>
        </div>
        <button onClick={onRefresh} type="button">
          Refresh library
        </button>
      </header>

      <section className="library-create" aria-labelledby="create-workflow-title">
        <div className="library-create__heading">
          <div>
            <p className="product-kicker">Create workflow</p>
            <h2 id="create-workflow-title">Start from the clearest input.</h2>
          </div>
          <p>Each path produces the same editable WorkflowSpec draft.</p>
        </div>
        <div className="library-mode-switch" aria-label="Workflow creation mode">
          {authoringModes.map((mode) => (
            <button
              aria-pressed={mode.id === activeMode}
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              type="button"
            >
              <strong>{mode.label}</strong>
              <span>{mode.summary}</span>
            </button>
          ))}
        </div>
        {authoringModes.map((mode) => (
          <div
            className="library-authoring-panel"
            hidden={mode.id !== activeMode}
            key={mode.id}
          >
            {authoringPanels[mode.id]}
          </div>
        ))}
      </section>

      <section className="library-workflows" aria-labelledby="saved-workflows-title">
        <div className="library-workflows__heading">
          <div>
            <p className="product-kicker">Saved workflows</p>
            <h2 id="saved-workflows-title">Choose the next action.</h2>
          </div>
          <dl aria-label="Workflow totals">
            <div>
              <dt>Total</dt>
              <dd>{workflows.length}</dd>
            </div>
            <div>
              <dt>Active</dt>
              <dd>
                {workflows.filter((workflow) => workflow.status === "active").length}
              </dd>
            </div>
            <div>
              <dt>Drafts</dt>
              <dd>
                {workflows.filter((workflow) => workflow.draftVersion).length}
              </dd>
            </div>
          </dl>
        </div>

        <div className="library-latest-action" role="status">
          <span>Latest action</span>
          <p>{message || "Choose a workflow to run or continue editing."}</p>
        </div>

        {workflows.length === 0 ? (
          <div className="product-empty">
            <strong>No workflow drafts yet</strong>
            <p>Choose an authoring path above to create the first draft.</p>
          </div>
        ) : (
          <div className="workflow-list-table">
            <table>
              <caption>Workflow drafts and published versions</caption>
              <thead>
                <tr>
                  <th>Workflow</th>
                  <th>Status</th>
                  <th>Last run</th>
                  <th>Success</th>
                  <th>Version</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((workflow) => (
                  <tr key={workflow.id}>
                    <td data-label="Workflow">
                      <strong>{workflow.title}</strong>
                      <small>
                        Updated {new Date(workflow.updatedAt).toLocaleString()}
                      </small>
                    </td>
                    <td data-label="Status">
                      <span className="status-pill" data-status={workflow.status}>
                        {workflow.status}
                      </span>
                    </td>
                    <td data-label="Last run">
                      {workflow.lastRunAt
                        ? new Date(workflow.lastRunAt).toLocaleDateString()
                        : "Not run"}
                    </td>
                    <td data-label="Success">
                      {workflow.successRate === null
                        ? "Not measured"
                        : `${workflow.successRate}%`}
                    </td>
                    <td data-label="Version">
                      {workflow.draftVersion
                        ? `Draft v${workflow.draftVersion}`
                        : workflow.activeVersion
                          ? `Active v${workflow.activeVersion}`
                          : "Archived"}
                    </td>
                    <td data-label="Actions">
                      <div className="workflow-row-actions">
                        {workflow.activeVersion ? (
                          <button onClick={() => onRun(workflow)} type="button">
                            Run
                          </button>
                        ) : null}
                        <button
                          onClick={() => onOpenWorkflow(workflow)}
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
      </section>

      {runDialog}

      <details className="library-disclosure">
        <summary>
          <span>
            <strong>Operational evidence</strong>
            <small>Run history, controlled beta evidence, and support tools</small>
          </span>
          <b>Advanced</b>
        </summary>
        <div>{operations}</div>
      </details>
    </section>
  );
}
