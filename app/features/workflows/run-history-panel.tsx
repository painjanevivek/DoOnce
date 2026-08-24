"use client";

import { useCallback, useEffect, useState } from "react";
import { RepairProposalCard } from "./repair-proposal-card";
import type { StepResult } from "../../../contracts/protocol";

interface ReleaseIdentity {
  schemaVersion: 1;
  deploymentId: string;
  environment: string;
  backendCommit: string;
  frontendCommit: string;
  backendImageDigest: string;
  frontendImageDigest: string;
  extensionId: string;
  extensionVersion: string;
  extensionPackageSha256: string;
  protocolSchemaSha256: string;
  migrationSetSha256: string;
}
interface RunItem {
  id: string;
  workflowId: string;
  workflowVersion: number;
  workflowChecksum: string;
  mode: "test" | "production";
  status:
    "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
  requestedAt: string;
  currentStepIndex: number;
  result?: { reasonCode?: string };
  releaseIdentity?: ReleaseIdentity;
}
export interface RedactedRunTimeline {
  run: RunItem;
  steps: StepResult[];
  events: Array<{
    id: string;
    eventType: string;
    stepId?: string;
    createdAt: string;
  }>;
  artifacts: Array<{
    id: string;
    fileName: string;
    contentType: string;
    byteSize: number;
    checksumSha256: string;
    createdAt: string;
  }>;
}

export function RunHistoryPanel({ apiBaseUrl, mvpMode = false }: { apiBaseUrl: string; mvpMode?: boolean }) {
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [timeline, setTimeline] = useState<RedactedRunTimeline | null>(null);
  const [message, setMessage] = useState("");
  const loadRuns = useCallback(async () => {
    const response = await fetch(`${apiBaseUrl}/api/v1/runs`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    const body: unknown = await response.json();
    if (response.ok && isRunList(body)) setRuns(body.runs);
  }, [apiBaseUrl]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRuns();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRuns]);

  async function open(runId: string) {
    setMessage("Loading verified timeline…");
    const response = await fetch(
      `${apiBaseUrl}/api/v1/runs/${runId}/timeline`,
      { credentials: "include", headers: { Accept: "application/json" } },
    );
    const body: unknown = await response.json();
    if (response.ok && isTimelineResponse(body)) {
      setTimeline(body.timeline);
      setMessage("");
    } else setMessage("Run timeline is unavailable.");
  }
  async function download(artifactId: string) {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/artifacts/${artifactId}/download-link`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: "{}",
      },
    );
    const body: unknown = await response.json();
    if (response.ok && isDownloadGrant(body)) {
      const link = document.createElement("a");
      link.href = `${apiBaseUrl}${body.url}`;
      link.rel = "noopener";
      link.click();
    } else setMessage("Artifact download link could not be created.");
  }

  function exportReceipt() {
    if (!timeline) return;
    const receipt = createRedactedReceipt(timeline);
    const url = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `doonce-receipt-${timeline.run.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <details className="run-history">
      <summary>
        Run history <span>{runs.length}</span>
      </summary>
      <div className="run-history__grid">
        <ol>
          {runs.length === 0 ? (
            <li>No extension runs yet.</li>
          ) : (
            runs.map((run) => (
              <li key={run.id}>
                <button
                  aria-pressed={timeline?.run.id === run.id}
                  onClick={() => void open(run.id)}
                  type="button"
                >
                  <span>
                    <strong>
                      {run.mode === "test"
                        ? "Draft test"
                        : `Version ${run.workflowVersion}`}
                    </strong>
                    <small>{new Date(run.requestedAt).toLocaleString()}</small>
                  </span>
                  <b data-status={run.status}>{run.status}</b>
                </button>
              </li>
            ))
          )}
        </ol>
        <div className="run-timeline">
          {timeline ? (
            <>
              <header>
                <div>
                  <p className="eyebrow">Run {timeline.run.id.slice(0, 8)}</p>
                  <h3>{timeline.run.status}</h3>
                </div>
                <small>
                  Checksum {timeline.run.workflowChecksum.slice(0, 12)}
                </small>
              </header>
              <button className="secondary-button" onClick={exportReceipt} type="button">Export redacted receipt</button>
              {timeline.run.releaseIdentity ? (
                <details className="release-evidence">
                  <summary>Exact release evidence</summary>
                  <dl>
                    <div><dt>Deployment</dt><dd>{timeline.run.releaseIdentity.deploymentId}</dd></div>
                    <div><dt>Extension</dt><dd>{timeline.run.releaseIdentity.extensionVersion}</dd></div>
                    <div><dt>Package</dt><dd><code>{timeline.run.releaseIdentity.extensionPackageSha256.slice(0, 16)}</code></dd></div>
                  </dl>
                </details>
              ) : null}
              <ol>
                {timeline.steps.map((step, index) => (
                  <li key={step.stepId}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{step.status}</strong>
                      <small>
                        {step.reasonCode ??
                          `${step.finishedAt.slice(11, 19)} UTC`}
                      </small>
                    </div>
                    {step.assertionResults?.length ? (
                      <b>
                        {
                          step.assertionResults.filter(
                            (result) => result.status === "verified",
                          ).length
                        }
                        /{step.assertionResults.length} checks
                      </b>
                    ) : null}
                  </li>
                ))}
              </ol>
              {!mvpMode && ["paused", "failed"].includes(timeline.run.status) && <RepairProposalCard apiBaseUrl={apiBaseUrl} runId={timeline.run.id} />}
              {timeline.artifacts.length > 0 && (
                <div className="artifact-list">
                  <h4>Artifacts</h4>
                  {timeline.artifacts.map((artifact) => (
                    <button
                      key={artifact.id}
                      onClick={() => void download(artifact.id)}
                      type="button"
                    >
                      <span>
                        <strong>{artifact.fileName}</strong>
                        <small>
                          {artifact.contentType} ·{" "}
                          {formatBytes(artifact.byteSize)}
                        </small>
                      </span>
                      <b>Download</b>
                    </button>
                  ))}
                </div>
              )}
              <details>
                <summary>Technical events ({timeline.events.length})</summary>
                <ol className="event-list">
                  {timeline.events.map((event) => (
                    <li key={event.id}>
                      <time>
                        {new Date(event.createdAt).toLocaleTimeString()}
                      </time>
                      <code>{event.eventType}</code>
                    </li>
                  ))}
                </ol>
              </details>
            </>
          ) : (
            <div className="studio-empty">
              <strong>Select a run</strong>
              <p>
                Open a run to inspect verified steps, artifacts, and technical
                events.
              </p>
            </div>
          )}
        </div>
      </div>
      <p className="library-message" role="status">
        {message}
      </p>
    </details>
  );
}

export function createRedactedReceipt(timeline: RedactedRunTimeline) {
  return {
    format: "doonce.attended-run-receipt.v1",
    run: {
      id: timeline.run.id,
      workflowId: timeline.run.workflowId,
      workflowVersion: timeline.run.workflowVersion,
      workflowChecksum: timeline.run.workflowChecksum,
      mode: timeline.run.mode,
      status: timeline.run.status,
      requestedAt: timeline.run.requestedAt,
      ...(timeline.run.result?.reasonCode ? { reasonCode: timeline.run.result.reasonCode } : {}),
    },
    ...(timeline.run.releaseIdentity ? { release: timeline.run.releaseIdentity } : {}),
    steps: timeline.steps.map((step) => ({ stepId: step.stepId, status: step.status, ...(step.reasonCode ? { reasonCode: step.reasonCode } : {}), assertions: step.assertionResults?.map(({ assertionId, status, reasonCode, verifiedAt }) => ({ assertionId, status, ...(reasonCode ? { reasonCode } : {}), verifiedAt })) ?? [] })),
    artifacts: timeline.artifacts.map(({ id, fileName, contentType, byteSize, checksumSha256, createdAt }) => ({ id, fileName, contentType, byteSize, checksumSha256, createdAt })),
  };
}

function isRun(value: unknown): value is RunItem {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as RunItem).id === "string" &&
    typeof (value as RunItem).workflowChecksum === "string" &&
    ((value as RunItem).mode === "test" ||
      (value as RunItem).mode === "production") &&
    ((value as RunItem).releaseIdentity === undefined || isReleaseIdentity((value as RunItem).releaseIdentity)),
  );
}
function isRunList(value: unknown): value is { runs: RunItem[] } {
  return Boolean(
    value &&
    typeof value === "object" &&
    Array.isArray((value as { runs?: unknown }).runs) &&
    (value as { runs: unknown[] }).runs.every(isRun),
  );
}
function isTimelineResponse(value: unknown): value is { timeline: RedactedRunTimeline } {
  const timeline =
    value && typeof value === "object"
      ? (value as { timeline?: unknown }).timeline
      : undefined;
  return Boolean(
    timeline &&
    typeof timeline === "object" &&
    isRun((timeline as RedactedRunTimeline).run) &&
    Array.isArray((timeline as RedactedRunTimeline).steps) &&
    Array.isArray((timeline as RedactedRunTimeline).events) &&
    Array.isArray((timeline as RedactedRunTimeline).artifacts),
  );
}
function isReleaseIdentity(value: unknown): value is ReleaseIdentity {
  if (!value || typeof value !== "object") return false;
  const release = value as Partial<ReleaseIdentity>;
  return release.schemaVersion === 1
    && typeof release.deploymentId === "string"
    && typeof release.environment === "string"
    && typeof release.backendCommit === "string"
    && typeof release.frontendCommit === "string"
    && typeof release.backendImageDigest === "string"
    && typeof release.frontendImageDigest === "string"
    && typeof release.extensionId === "string"
    && typeof release.extensionVersion === "string"
    && typeof release.extensionPackageSha256 === "string"
    && typeof release.protocolSchemaSha256 === "string"
    && typeof release.migrationSetSha256 === "string";
}
function isDownloadGrant(value: unknown): value is { url: string } {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as { url?: unknown }).url === "string" &&
    (value as { url: string }).url.startsWith("/api/v1/artifact-downloads/"),
  );
}
function formatBytes(value: number): string {
  return value < 1024
    ? `${value} B`
    : value < 1024 * 1024
      ? `${(value / 1024).toFixed(1)} KB`
      : `${(value / 1024 / 1024).toFixed(1)} MB`;
}
