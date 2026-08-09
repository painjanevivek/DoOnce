"use client";

import { useEffect, useState } from "react";
import type { WorkflowSpec } from "../../../contracts/protocol";
import type { TestPreview } from "./authoring-types";

interface TestRun {
  id: string;
  status:
    "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
  currentStepIndex: number;
  result?: { reasonCode?: string };
}

export function WorkflowTestPanel({
  apiBaseUrl,
  workflowId,
  spec,
  disabled,
  onPassingTest,
}: {
  apiBaseUrl: string;
  workflowId: string;
  spec: WorkflowSpec;
  disabled: boolean;
  onPassingTest(): void;
}) {
  const [executor, setExecutor] = useState<"extension" | "hosted-browser">(
    "extension",
  );
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      spec.inputs.flatMap((input) =>
        input.defaultValue === undefined
          ? []
          : [[input.name, input.defaultValue]],
      ),
    ),
  );
  const [preview, setPreview] = useState<TestPreview | null>(null);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [testRun, setTestRun] = useState<TestRun | null>(null);

  useEffect(() => {
    if (
      !testRun ||
      ["completed", "paused", "failed", "cancelled"].includes(testRun.status)
    )
      return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/v1/runs/${testRun.id}`,
          {
            credentials: "include",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );
        const body: unknown = await response.json();
        if (!response.ok || !isRunResponse(body)) {
          setMessage("The run timeline is temporarily unavailable; polling will resume.");
          setTestRun((current) => current ? { ...current } : current);
          return;
        }
        setTestRun(body.run);
        if (body.run.status === "completed") {
          onPassingTest();
          setMessage(
            "This exact saved draft passed. It is now eligible for publication.",
          );
        } else if (["paused", "failed", "cancelled"].includes(body.run.status))
          setMessage(
            `Draft test ${body.run.status}: ${body.run.result?.reasonCode ?? "review the run timeline"}.`,
          );
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setMessage("The run timeline is temporarily unavailable; polling will resume.");
          setTestRun((current) => current ? { ...current } : current);
        }
      }
    }, 2_000);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [apiBaseUrl, onPassingTest, testRun]);

  async function prepare() {
    setRunning(true);
    setMessage("");
    setPreview(null);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/workflow-specs/${workflowId}/test-preview`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ executor, inputs }),
        },
      );
      const body: unknown = await response.json();
      if (!response.ok || !isPreviewResponse(body))
        throw new Error(readError(body));
      setPreview(body.preview);
      setMessage(
        executor === "extension"
          ? "Test plan is ready. Publish this version, then queue an attended extension run from the workflow library."
          : "Hosted-browser plan is ready. Hosted execution is intentionally unavailable until its runtime is deployed.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Test setup could not be verified.",
      );
    } finally {
      setRunning(false);
    }
  }

  async function queueTest() {
    setRunning(true);
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/runs`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          workflowId,
          inputs,
          mode: "test",
          idempotencyKey: `draft-test:${crypto.randomUUID()}`,
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok || !isRunCreated(body)) throw new Error(readError(body));
      setTestRun(body.run);
      setMessage(
        "Draft test queued. Keep the extension connected and an approved workflow page open.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The draft test could not be queued.",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="studio-section test-panel" aria-labelledby="test-title">
      <div className="studio-section__heading">
        <div>
          <p className="eyebrow">Test mode</p>
          <h2 id="test-title">Prepare a controlled run</h2>
          <p>
            Validate the exact input and step plan before publication. Published
            extension runs are queued from the workflow library.
          </p>
        </div>
        <label className="runtime-select">
          <span>Runtime</span>
          <select
            value={executor}
            onChange={(event) =>
              setExecutor(event.target.value as typeof executor)
            }
          >
            <option value="extension">Local Chrome extension</option>
            <option value="hosted-browser">Hosted browser</option>
          </select>
        </label>
      </div>
      {spec.inputs.length > 0 && (
        <div className="test-inputs">
          {spec.inputs.map((input) => (
            <label key={input.name}>
              <span>
                {input.label}
                {input.required ? " *" : ""}
              </span>
              {input.kind === "select" ? (
                <select
                  value={inputs[input.name] ?? ""}
                  onChange={(event) =>
                    setInputs((current) => ({
                      ...current,
                      [input.name]: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose…</option>
                  {input.options?.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={
                    input.secret
                      ? "password"
                      : input.kind === "date"
                        ? "date"
                        : "text"
                  }
                  value={inputs[input.name] ?? ""}
                  onChange={(event) =>
                    setInputs((current) => ({
                      ...current,
                      [input.name]: event.target.value,
                    }))
                  }
                />
              )}
            </label>
          ))}
        </div>
      )}
      <div className="run-launcher__actions">
        <button
          className="secondary-button"
          disabled={disabled || running}
          onClick={() => void prepare()}
          type="button"
        >
          {running ? "Checking test plan…" : "Prepare test plan"}
        </button>
        <button
          className="primary-button"
          disabled={
            disabled ||
            running ||
            !preview ||
            executor !== "extension" ||
            Boolean(
              testRun &&
              !["completed", "paused", "failed", "cancelled"].includes(
                testRun.status,
              ),
            )
          }
          onClick={() => void queueTest()}
          type="button"
        >
          Queue draft test
        </button>
      </div>
      {testRun && (
        <div className="run-progress" data-status={testRun.status}>
          <span>Exact saved draft</span>
          <strong>{testRun.status}</strong>
          <small>
            {testRun.currentStepIndex} step
            {testRun.currentStepIndex === 1 ? "" : "s"} checkpointed
          </small>
        </div>
      )}
      <p className="test-message" role="status">
        {message}
      </p>
      {preview && (
        <ol className="test-timeline">
          {preview.steps.map((step, index) => (
            <li key={step.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{step.name}</strong>
                <small>{step.message}</small>
              </div>
              <b data-readiness={step.readiness}>
                {step.readiness.replace("-", " ")}
              </b>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function isPreviewResponse(value: unknown): value is { preview: TestPreview } {
  if (!value || typeof value !== "object") return false;
  const preview = (value as { preview?: unknown }).preview;
  if (!preview || typeof preview !== "object") return false;
  const candidate = preview as Partial<TestPreview>;
  return (
    candidate.status === "ready" &&
    typeof candidate.workflowId === "string" &&
    typeof candidate.version === "number" &&
    typeof candidate.checksum === "string" &&
    (candidate.executor === "extension" ||
      candidate.executor === "hosted-browser") &&
    Array.isArray(candidate.inputs) &&
    candidate.inputs.every(
      (input) =>
        typeof input.name === "string" &&
        typeof input.provided === "boolean" &&
        typeof input.secret === "boolean",
    ) &&
    Array.isArray(candidate.steps) &&
    candidate.steps.every(
      (step) =>
        typeof step.id === "string" &&
        typeof step.name === "string" &&
        typeof step.action === "string" &&
        (step.readiness === "ready" ||
          step.readiness === "approval-required" ||
          step.readiness === "checkpoint") &&
        typeof step.message === "string",
    )
  );
}
function readError(value: unknown): string {
  return value &&
    typeof value === "object" &&
    typeof (value as { error?: unknown }).error === "string"
    ? (value as { error: string }).error
    : "Test setup could not be verified.";
}
function isRun(value: unknown): value is TestRun {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as TestRun).id === "string" &&
    [
      "queued",
      "running",
      "paused",
      "completed",
      "failed",
      "cancelled",
    ].includes((value as TestRun).status),
  );
}
function isRunCreated(value: unknown): value is { run: TestRun } {
  return Boolean(
    value &&
    typeof value === "object" &&
    isRun((value as { run?: unknown }).run),
  );
}
function isRunResponse(value: unknown): value is { run: TestRun } {
  return isRunCreated(value);
}
