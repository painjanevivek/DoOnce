"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusNotice,
  type StatusTone,
} from "../../components/product-state";
import {
  PilotProofRail,
  type PilotProofStep,
} from "../../components/pilot-proof-rail";
import type { ExtensionConnection, WorkflowSummary } from "./authoring-types";
import { deriveFirstWorkflowProgress } from "./first-workflow-guide";

export type WorkflowLibraryState = "loading" | "ready" | "signed-out" | "error";
export type AuthoringMode = "record" | "describe" | "video";
type ExtensionConnectionState = "confirmed" | "unavailable";

interface WorkflowLibraryViewProps {
  state: WorkflowLibraryState;
  workflows: WorkflowSummary[];
  message: string;
  activeMode: AuthoringMode;
  availableModes: AuthoringMode[];
  authoringPanels: Record<AuthoringMode, ReactNode>;
  operations: ReactNode;
  runDialog: ReactNode;
  mvpMode: boolean;
  pilotOrigin: string | null;
  extensionConnection: ExtensionConnection | null;
  extensionConnectionState: ExtensionConnectionState;
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
  { id: "record", label: "Show it in Chrome", summary: "Record one careful browser demonstration." },
  { id: "describe", label: "Describe the task", summary: "Create an editable draft from plain language." },
  { id: "video", label: "Upload a video", summary: "Calibrate an existing walkthrough before compilation." },
];

type NextAction = {
  description: string;
  kind: "connect" | "record" | "review" | "run" | "wait";
  label?: string;
  title: string;
  workflow?: WorkflowSummary;
};

export function WorkflowLibraryView({
  state,
  workflows,
  message,
  activeMode,
  availableModes,
  authoringPanels,
  operations,
  runDialog,
  mvpMode,
  pilotOrigin,
  extensionConnection,
  extensionConnectionState,
  onModeChange,
  onRefresh,
  onOpenWorkflow,
  onRun,
}: WorkflowLibraryViewProps) {
  const visibleAuthoringModes = authoringModes.filter((mode) => availableModes.includes(mode.id));
  const progress = deriveFirstWorkflowProgress(workflows);
  const currentWorkflow = progress.workflow ?? workflows.find((workflow) => workflow.draftVersion) ?? null;
  const nextAction = deriveNextAction({ extensionConnection, extensionConnectionState, mvpMode, pilotOrigin, progress });

  if (state === "loading") return <LoadingState eyebrow="Pilot workspace" label="Loading pilot workspace" />;

  if (state === "signed-out") {
    return (
      <EmptyState
        action={<Link className="primary-button" href="/sign-up">Sign in or create a workspace</Link>}
        description="Workflow drafts stay associated with their signed-in workspace."
        eyebrow="Pilot workspace"
        title="Sign in to open your workspace."
      />
    );
  }

  if (state === "error") {
    return (
      <ErrorState
        action={<button className="primary-button" onClick={onRefresh} type="button">Try again</button>}
        description="Your drafts were not changed. Check the service connection, then retry."
        eyebrow="Pilot workspace"
        title="The workflow service is unavailable."
      />
    );
  }

  return (
    <section className="pilot-workspace" aria-labelledby="pilot-workspace-title">
      <header className="pilot-workspace__header">
        <div>
          <p className="product-kicker">Attended pilot workspace</p>
          <h1 id="pilot-workspace-title">One safe next action.</h1>
          <p>Review the approved boundary, confirm Chrome readiness, then continue the one report workflow supported by the server.</p>
        </div>
        <button className="secondary-button" onClick={onRefresh} type="button">Refresh workspace</button>
      </header>

      {mvpMode ? (
        <PilotProofRail steps={proofSteps({ extensionConnection, extensionConnectionState, pilotOrigin, progress })} />
      ) : (
        <StatusNotice tone="warning" title="Pilot boundary not configured">
          This workspace is not in attended MVP mode. No pilot origin or report contract is shown here.
        </StatusNotice>
      )}

      {mvpMode ? (
        <section className="pilot-readiness" aria-labelledby="pilot-readiness-title">
          <header>
            <h2 id="pilot-readiness-title">Pilot readiness</h2>
            <p>Every status below is based on the current server response.</p>
          </header>
          <div className="pilot-readiness__grid">
            <StatusNotice tone={pilotOrigin ? "success" : "warning"} title="Approved origin">
              {pilotOrigin ? <p><strong>{pilotOrigin}</strong><br />The server configured this exact origin for the pilot.</p> : <p>No approved pilot origin is configured. Recording and production runs remain unavailable.</p>}
            </StatusNotice>
            <StatusNotice tone={connectionTone(extensionConnection, extensionConnectionState)} title="Chrome extension">
              <p>{connectionMessage(extensionConnection, extensionConnectionState)}</p>
            </StatusNotice>
            <StatusNotice tone={currentWorkflow ? "info" : "warning"} title="Current workflow">
              <p>{workflowMessage(currentWorkflow)}</p>
            </StatusNotice>
          </div>
        </section>
      ) : null}

      <section className="next-safe-action" aria-labelledby="next-safe-action-title">
        <div>
          <p className="product-kicker">Next safe action</p>
          <h2 id="next-safe-action-title">{nextAction.title}</h2>
          <p>{nextAction.description}</p>
        </div>
        {nextAction.label ? (
          <button className="primary-button" onClick={() => performNextAction(nextAction, onModeChange, onOpenWorkflow, onRun)} type="button">
            {nextAction.label}
          </button>
        ) : null}
      </section>

      <section className="library-workflows" aria-labelledby="saved-workflows-title">
        <div className="library-workflows__heading">
          <div>
            <p className="product-kicker">Current workflow</p>
            <h2 id="saved-workflows-title">Review before you run.</h2>
          </div>
          <dl aria-label="Workflow totals">
            <div><dt>Total</dt><dd>{workflows.length}</dd></div>
            <div><dt>Active</dt><dd>{workflows.filter((workflow) => workflow.status === "active").length}</dd></div>
            <div><dt>Drafts</dt><dd>{workflows.filter((workflow) => workflow.draftVersion).length}</dd></div>
          </dl>
        </div>

        <div className="library-latest-action" role="status">
          <span>Latest action</span>
          <p>{message || "No action has been recorded in this browser session."}</p>
        </div>

        {workflows.length === 0 ? (
          <EmptyState
            action={<button className="primary-button" onClick={() => onModeChange("record")} type="button">Open Chrome recording</button>}
            description={mvpMode ? "Record the approved report download to create the first draft." : "Choose an available authoring path to create the first draft."}
            title="No workflow drafts yet."
          />
        ) : (
          <ul className="workflow-card-list" aria-label="Saved workflows">
            {workflows.map((workflow) => (
              <li key={workflow.id}>
                <article className="workflow-card" data-status={workflow.status}>
                  <header>
                    <div>
                      <span className="status-pill" data-status={workflow.status}>{workflow.status}</span>
                      <h3>{workflow.title}</h3>
                    </div>
                    <span className="workflow-card__version">{versionLabel(workflow)}</span>
                  </header>
                  <dl>
                    <div><dt>Updated</dt><dd>{formatDate(workflow.updatedAt)}</dd></div>
                    <div><dt>Latest run</dt><dd>{workflow.lastRunAt ? formatDate(workflow.lastRunAt) : "No recorded run"}</dd></div>
                  </dl>
                  <div className="workflow-card__actions">
                    {workflow.activeVersion ? <button className="primary-button" onClick={() => onRun(workflow)} type="button">Approve a run</button> : null}
                    <button className="secondary-button" onClick={() => onOpenWorkflow(workflow)} type="button">
                      {workflow.draftVersion ? "Review draft" : "Create reviewed version"}
                    </button>
                  </div>
                  <details>
                    <summary>Workflow evidence</summary>
                    <dl className="workflow-card__details">
                      <div><dt>Version</dt><dd>{versionLabel(workflow)}</dd></div>
                      <div><dt>Reported success rate</dt><dd>{workflow.successRate === null ? "Not measured" : `${workflow.successRate}%`}</dd></div>
                    </dl>
                  </details>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="receipt-evidence" aria-labelledby="receipt-evidence-title">
        <div>
          <p className="product-kicker">Receipt evidence</p>
          <h2 id="receipt-evidence-title">Inspect evidence before relying on it.</h2>
          <p>Workflow summaries do not prove a download. Open operational evidence to inspect the selected run, verified artifact, and immutable receipt data.</p>
        </div>
      </section>

      <section className="library-create" aria-labelledby="create-workflow-title">
        <div className="library-create__heading">
          <div>
            <p className="product-kicker">Create workflow</p>
            <h2 id="create-workflow-title">{mvpMode ? "Show the report download in Chrome." : "Start from the clearest input."}</h2>
          </div>
          <p>{mvpMode ? "The MVP accepts one recorded demonstration on the approved origin." : "Each path produces the same editable workflow draft."}</p>
        </div>
        <div className="library-mode-switch" aria-label="Workflow creation mode">
          {visibleAuthoringModes.map((mode) => (
            <button aria-pressed={mode.id === activeMode} key={mode.id} onClick={() => onModeChange(mode.id)} type="button">
              <strong>{mode.label}</strong>
              <span>{mode.summary}</span>
            </button>
          ))}
        </div>
        {visibleAuthoringModes.map((mode) => (
          <div className="library-authoring-panel" hidden={mode.id !== activeMode} key={mode.id}>
            {authoringPanels[mode.id]}
          </div>
        ))}
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

function deriveNextAction({ extensionConnection, extensionConnectionState, mvpMode, pilotOrigin, progress }: {
  extensionConnection: ExtensionConnection | null;
  extensionConnectionState: ExtensionConnectionState;
  mvpMode: boolean;
  pilotOrigin: string | null;
  progress: ReturnType<typeof deriveFirstWorkflowProgress>;
}): NextAction {
  if (mvpMode && !pilotOrigin) return { description: "An authorized exact HTTPS origin must be configured before this pilot can continue.", kind: "wait", title: "Pilot boundary is not ready." };
  if (mvpMode && (extensionConnectionState !== "confirmed" || !extensionConnection?.connected)) return {
    description: extensionConnectionState === "unavailable" ? "Chrome readiness could not be confirmed. Open the connection panel and retry after the service is available." : "Pair the Chrome extension. The server has not confirmed a connected extension for this workspace.",
    kind: "connect",
    label: "Open Chrome connection",
    title: "Connect Chrome before recording.",
  };
  if (progress.stage === "review" && progress.workflow) return { description: "Review the saved draft and verify its exact steps before publication.", kind: "review", label: "Review draft", title: "Review the draft before publishing.", workflow: progress.workflow };
  if ((progress.stage === "verify" || progress.stage === "repeat") && progress.workflow) return { description: "A fresh approval is required before the connected extension can claim this one run.", kind: "run", label: "Approve one run", title: "Approve the next attended run.", workflow: progress.workflow };
  return { description: mvpMode ? "Record the approved report download in Chrome. Other authoring paths are outside this pilot." : "Choose the available authoring path before creating a draft.", kind: "record", label: mvpMode ? "Record the report" : "Open authoring", title: "Create the first reviewable draft." };
}

function proofSteps({ extensionConnection, extensionConnectionState, pilotOrigin, progress }: {
  extensionConnection: ExtensionConnection | null;
  extensionConnectionState: ExtensionConnectionState;
  pilotOrigin: string | null;
  progress: ReturnType<typeof deriveFirstWorkflowProgress>;
}): PilotProofStep[] {
  return [
    { label: "Approved origin", description: pilotOrigin ?? "No origin configured.", state: pilotOrigin ? "complete" : "blocked" },
    { label: "Extension connected", description: connectionMessage(extensionConnection, extensionConnectionState), state: extensionConnectionState === "unavailable" ? "blocked" : extensionConnection?.connected ? "complete" : "current" },
    { label: "Workflow ready", description: workflowMessage(progress.workflow ?? null), state: progress.stage === "teach" ? "pending" : progress.stage === "review" ? "current" : "complete" },
    { label: "Run approved", description: "Fresh approval is required for each production run.", state: "pending" },
    { label: "File verified", description: "Shown only after server verification.", state: "pending" },
    { label: "Receipt recorded", description: "Inspect it in operational evidence.", state: "pending" },
  ];
}

function performNextAction(action: NextAction, onModeChange: (mode: AuthoringMode) => void, onOpenWorkflow: (workflow: WorkflowSummary) => void, onRun: (workflow: WorkflowSummary) => void) {
  if (action.kind === "connect" || action.kind === "record") onModeChange("record");
  if (action.kind === "review" && action.workflow) onOpenWorkflow(action.workflow);
  if (action.kind === "run" && action.workflow) onRun(action.workflow);
}

function connectionTone(connection: ExtensionConnection | null, state: ExtensionConnectionState): StatusTone {
  if (state === "unavailable") return "error";
  return connection?.connected ? "success" : "warning";
}

function connectionMessage(connection: ExtensionConnection | null, state: ExtensionConnectionState): string {
  if (state === "unavailable") return "The server could not confirm Chrome readiness.";
  if (!connection?.connected) return "No connected extension is confirmed for this workspace.";
  return `Server confirmed the connected extension${connection.extensionVersion ? ` v${connection.extensionVersion}` : ""}${connection.lastSeenAt ? ` at ${formatDate(connection.lastSeenAt)}` : ""}.`;
}

function workflowMessage(workflow: WorkflowSummary | null): string {
  if (!workflow) return "No reviewed workflow is available yet.";
  if (workflow.draftVersion) return `${workflow.title} has a draft ready for review.`;
  if (workflow.activeVersion) return `${workflow.title} has a published version ready for fresh approval.`;
  return `${workflow.title} needs a new reviewed version.`;
}

function versionLabel(workflow: WorkflowSummary): string {
  if (workflow.draftVersion) return `Draft v${workflow.draftVersion}`;
  if (workflow.activeVersion) return `Active v${workflow.activeVersion}`;
  return "No active version";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}
