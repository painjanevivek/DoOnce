"use client";

import { useCallback, useEffect, useState } from "react";
import type { StepResult } from "../../../contracts/protocol";

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
}
interface Timeline {
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

export function RunHistoryPanel({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
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

function isRun(value: unknown): value is RunItem {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as RunItem).id === "string" &&
    typeof (value as RunItem).workflowChecksum === "string" &&
    ((value as RunItem).mode === "test" ||
      (value as RunItem).mode === "production"),
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
function isTimelineResponse(value: unknown): value is { timeline: Timeline } {
  const timeline =
    value && typeof value === "object"
      ? (value as { timeline?: unknown }).timeline
      : undefined;
  return Boolean(
    timeline &&
    typeof timeline === "object" &&
    isRun((timeline as Timeline).run) &&
    Array.isArray((timeline as Timeline).steps) &&
    Array.isArray((timeline as Timeline).events) &&
    Array.isArray((timeline as Timeline).artifacts),
  );
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
