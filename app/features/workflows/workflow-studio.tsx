"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorkflowSpec } from "../../../contracts/protocol";
import { validateContract } from "../../../contracts/validation";
import type { WorkflowDraft, WorkflowVersion } from "./authoring-types";
import {
  applyEditorChange,
  createEditorHistory,
  currentEditorSpec,
  redoEditorChange,
  undoEditorChange,
  validateEditorSpec,
  type EditorHistory,
} from "./editor-model";
import { WorkflowInputEditor } from "./workflow-input-editor";
import { WorkflowStepEditor } from "./workflow-step-editor";
import { WorkflowTestPanel } from "./workflow-test-panel";
import { WorkflowVersionHistory } from "./workflow-version-history";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";
type StudioView = "overview" | "steps" | "inputs" | "test" | "history" | "json";

export default function WorkflowStudio({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const [history, setHistory] = useState<EditorHistory | null>(null);
  const [checksum, setChecksum] = useState("");
  const [version, setVersion] = useState(0);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [view, setView] = useState<StudioView>("overview");
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">(
    "loading",
  );
  const [saveState, setSaveState] = useState<
    "saved" | "saving" | "invalid" | "conflict" | "error"
  >("saved");
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState<WorkflowDraft | null>(null);
  const [message, setMessage] = useState("");
  const [testEvidenceVerified, setTestEvidenceVerified] = useState(false);
  const revision = useRef(0);
  const saving = useRef(false);
  const [saveTick, setSaveTick] = useState(0);
  const spec = history ? currentEditorSpec(history) : null;
  const issues = useMemo(() => (spec ? validateEditorSpec(spec) : []), [spec]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [draftResponse, versionsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/v1/workflow-specs/${workflowId}`, {
            credentials: "include",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          }),
          fetch(`${apiBaseUrl}/api/v1/workflow-specs/${workflowId}/versions`, {
            credentials: "include",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          }),
        ]);
        if (draftResponse.status === 404) return setState("missing");
        const draftBody: unknown = await draftResponse.json();
        const versionsBody: unknown = await versionsResponse.json();
        if (
          !draftResponse.ok ||
          !isDraftResponse(draftBody) ||
          !versionsResponse.ok ||
          !isVersionsResponse(versionsBody)
        )
          throw new Error("Workflow editor unavailable.");
        setHistory(createEditorHistory(draftBody.workflow.spec));
        setChecksum(draftBody.workflow.checksum);
        setVersion(draftBody.workflow.version);
        setVersions(versionsBody.versions);
        setTestEvidenceVerified(
          Boolean(draftBody.workflow.testEvidenceVerified),
        );
        setState("ready");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          setState("error");
      }
    }
    void load();
    return () => controller.abort();
  }, [workflowId]);

  useEffect(() => {
    if (!dirty || !spec || conflict || saving.current) return;
    if (issues.length > 0) return;
    const savedRevision = revision.current;
    const timer = window.setTimeout(async () => {
      saving.current = true;
      setSaveState("saving");
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/v1/workflow-specs/${workflowId}/save`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ expectedChecksum: checksum, spec }),
          },
        );
        const body: unknown = await response.json();
        if (response.status === 409 && isConflictResponse(body)) {
          setConflict(body.workflow);
          setSaveState("conflict");
          return;
        }
        if (!response.ok || !isDraftResponse(body))
          throw new Error(readError(body));
        setChecksum(body.workflow.checksum);
        if (revision.current === savedRevision) {
          setDirty(false);
          setSaveState("saved");
        } else setSaveTick((tick) => tick + 1);
      } catch (error) {
        setSaveState("error");
        setMessage(
          error instanceof Error ? error.message : "Draft autosave failed.",
        );
      } finally {
        saving.current = false;
        if (revision.current !== savedRevision) setSaveTick((tick) => tick + 1);
      }
    }, 850);
    return () => window.clearTimeout(timer);
  }, [checksum, conflict, dirty, issues.length, saveTick, spec, workflowId]);

  useEffect(() => {
    function receivePicker(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        !isPickerResult(event.data) ||
        !history
      )
        return;
      const current = currentEditorSpec(history);
      const steps = current.steps.map((step) =>
        step.id === event.data.stepId &&
        "target" in step &&
        "locator" in step.target
          ? { ...step, target: { ...step.target, locator: event.data.locator } }
          : step,
      );
      edit({ ...current, steps });
      setMessage(
        "Browser target updated. Review its confidence before publishing.",
      );
    }
    window.addEventListener("message", receivePicker);
    return () => window.removeEventListener("message", receivePicker);
  });

  function edit(next: WorkflowSpec) {
    if (!history) return;
    revision.current += 1;
    setHistory(applyEditorChange(history, next));
    setDirty(true);
    setTestEvidenceVerified(false);
    setSaveState(validateEditorSpec(next).length > 0 ? "invalid" : "saving");
  }
  function undo() {
    if (!history || history.index === 0) return;
    revision.current += 1;
    setHistory(undoEditorChange(history));
    setDirty(true);
  }
  function redo() {
    if (!history || history.index === history.snapshots.length - 1) return;
    revision.current += 1;
    setHistory(redoEditorChange(history));
    setDirty(true);
  }
  function loadServerDraft() {
    if (!conflict) return;
    revision.current += 1;
    setHistory(createEditorHistory(conflict.spec));
    setChecksum(conflict.checksum);
    setVersion(conflict.version);
    setConflict(null);
    setDirty(false);
    setSaveState("saved");
  }
  function keepLocalDraft() {
    if (!conflict) return;
    revision.current += 1;
    setChecksum(conflict.checksum);
    setConflict(null);
    setDirty(true);
    setSaveState("saving");
    setSaveTick((tick) => tick + 1);
  }
  const markPassingTest = useCallback(() => setTestEvidenceVerified(true), []);

  async function publish() {
    if (
      !spec ||
      dirty ||
      issues.length > 0 ||
      !testEvidenceVerified ||
      !window.confirm(
        `Publish version ${version}? The current active version will remain in history.`,
      )
    )
      return;
    setMessage("Publishing reviewed version…");
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/workflow-specs/${workflowId}/publish`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ expectedChecksum: checksum }),
        },
      );
      const body: unknown = await response.json();
      if (response.status === 409 && isConflictResponse(body)) {
        setConflict(body.workflow);
        setSaveState("conflict");
        return;
      }
      if (!response.ok) throw new Error(readError(body));
      router.push("/workflows");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Publication was not confirmed.",
      );
    }
  }

  if (state === "loading")
    return (
      <div className="studio-loading" aria-busy="true">
        <i />
        <i />
        <i />
      </div>
    );
  if (state === "missing")
    return (
      <div className="studio-state">
        <p className="eyebrow">Workflow editor</p>
        <h1>This workflow has no editable draft.</h1>
        <p>Create a new version from the workflow library.</p>
        <button
          className="primary-button"
          onClick={() => router.push("/workflows")}
          type="button"
        >
          Back to workflows
        </button>
      </div>
    );
  if (state === "error" || !spec || !history)
    return (
      <div className="studio-state" role="alert">
        <p className="eyebrow">Workflow editor</p>
        <h1>The editor could not load this draft.</h1>
        <p>No changes were made.</p>
        <button
          className="primary-button"
          onClick={() => window.location.reload()}
          type="button"
        >
          Try again
        </button>
      </div>
    );

  return (
    <div className="studio">
      <header className="studio-hero">
        <div>
          <button
            className="text-button"
            onClick={() => router.push("/workflows")}
            type="button"
          >
            ← Workflow library
          </button>
          <p className="eyebrow">Draft version {version}</p>
          <h1>{spec.title || "Untitled workflow"}</h1>
          <p>
            {spec.description ||
              "Add a purpose so reviewers know what this workflow should accomplish."}
          </p>
        </div>
        <div className="studio-save">
          <span data-state={saveState}>{saveLabel(saveState)}</span>
          <div>
            <button
              className="secondary-button"
              disabled={history.index === 0}
              onClick={undo}
              type="button"
            >
              Undo
            </button>
            <button
              className="secondary-button"
              disabled={history.index === history.snapshots.length - 1}
              onClick={redo}
              type="button"
            >
              Redo
            </button>
            <button
              className="primary-button"
              disabled={
                dirty ||
                issues.length > 0 ||
                saveState !== "saved" ||
                !testEvidenceVerified
              }
              onClick={() => void publish()}
              title={
                testEvidenceVerified
                  ? "Publish this tested draft"
                  : "Run this exact saved draft successfully before publishing"
              }
              type="button"
            >
              Publish version
            </button>
          </div>
        </div>
      </header>
      {conflict && (
        <div className="conflict-banner" role="alert">
          <div>
            <strong>This draft changed in another tab or session.</strong>
            <p>
              Load the server copy, or deliberately keep this tab’s version.
              Nothing is overwritten automatically.
            </p>
          </div>
          <button onClick={loadServerDraft} type="button">
            Load server copy
          </button>
          <button onClick={keepLocalDraft} type="button">
            Keep this tab’s changes
          </button>
        </div>
      )}
      {issues.length > 0 && (
        <div className="validation-banner" role="alert">
          <strong>
            {issues.length} validation issue{issues.length === 1 ? "" : "s"}
          </strong>
          <span>
            Invalid drafts are not autosaved or publishable. Open the affected
            section to correct each field.
          </span>
        </div>
      )}
      <nav className="studio-tabs" aria-label="Workflow editor sections">
        {(
          [
            "overview",
            "steps",
            "inputs",
            "test",
            "history",
            "json",
          ] as StudioView[]
        ).map((tab) => (
          <button
            aria-current={view === tab ? "page" : undefined}
            key={tab}
            onClick={() => setView(tab)}
            type="button"
          >
            {tab === "json"
              ? "Developer JSON"
              : `${tab[0]!.toUpperCase()}${tab.slice(1)}`}
            {tab === "steps" &&
            issues.some((issue) => issue.path.startsWith("/steps")) ? (
              <i aria-label="Has errors" />
            ) : null}
            {tab === "inputs" &&
            issues.some((issue) => issue.path.startsWith("/inputs")) ? (
              <i aria-label="Has errors" />
            ) : null}
          </button>
        ))}
      </nav>
      <main className="studio-main">
        {view === "overview" && (
          <WorkflowOverview spec={spec} onChange={edit} />
        )}
        {view === "steps" && (
          <WorkflowStepEditor issues={issues} onChange={edit} spec={spec} />
        )}
        {view === "inputs" && (
          <WorkflowInputEditor issues={issues} onChange={edit} spec={spec} />
        )}
        {view === "test" && (
          <WorkflowTestPanel
            apiBaseUrl={apiBaseUrl}
            disabled={dirty || issues.length > 0}
            key={`${checksum}-${spec.inputs.map((input) => input.name).join()}`}
            onPassingTest={markPassingTest}
            spec={spec}
            workflowId={workflowId}
          />
        )}
        {view === "history" && (
          <WorkflowVersionHistory draft={spec} versions={versions} />
        )}
        {view === "json" && (
          <section className="studio-section">
            <div className="studio-section__heading">
              <div>
                <p className="eyebrow">Diagnostics</p>
                <h2>Developer JSON</h2>
                <p>
                  Read-only canonical data for troubleshooting. Use the visual
                  fields for edits.
                </p>
              </div>
            </div>
            <textarea
              aria-label="WorkflowSpec JSON"
              className="json-view"
              readOnly
              value={JSON.stringify(spec, null, 2)}
            />
          </section>
        )}
      </main>
      <p className="studio-message" role="status">
        {message}
      </p>
    </div>
  );
}

function WorkflowOverview({
  spec,
  onChange,
}: {
  spec: WorkflowSpec;
  onChange(spec: WorkflowSpec): void;
}) {
  return (
    <section className="studio-section overview-editor">
      <div className="studio-section__heading">
        <div>
          <p className="eyebrow">Purpose and scope</p>
          <h2>Overview</h2>
          <p>
            Explain what goes in, what happens, and what successful completion
            looks like.
          </p>
        </div>
      </div>
      <label>
        <span>Workflow name</span>
        <input
          maxLength={120}
          value={spec.title}
          onChange={(event) => onChange({ ...spec, title: event.target.value })}
        />
      </label>
      <label>
        <span>Purpose</span>
        <textarea
          maxLength={1000}
          value={spec.description ?? ""}
          onChange={(event) =>
            onChange({
              ...spec,
              ...(event.target.value
                ? { description: event.target.value }
                : withoutDescription(spec)),
            })
          }
        />
      </label>
      <label>
        <span>Approved domains (one per line)</span>
        <textarea
          value={spec.allowedDomains.join("\n")}
          onChange={(event) =>
            onChange({
              ...spec,
              allowedDomains: event.target.value
                .split(/\r?\n/)
                .map((domain) => domain.trim().toLowerCase())
                .filter(Boolean)
                .slice(0, 20),
            })
          }
        />
      </label>
      <div className="overview-facts">
        <div>
          <span>Trigger</span>
          <strong>Manual run</strong>
        </div>
        <div>
          <span>Inputs</span>
          <strong>{spec.inputs.length}</strong>
        </div>
        <div>
          <span>Steps</span>
          <strong>{spec.steps.length}</strong>
        </div>
        <div>
          <span>Output</span>
          <strong>
            {spec.steps.some((step) => step.action === "download")
              ? "Downloaded file"
              : "Verified result"}
          </strong>
        </div>
      </div>
    </section>
  );
}
function withoutDescription(spec: WorkflowSpec) {
  void spec;
  return { description: "" };
}
function saveLabel(state: string) {
  return (
    {
      saved: "All changes saved",
      saving: "Saving changes…",
      invalid: "Fix validation issues",
      conflict: "Save conflict",
      error: "Autosave needs attention",
    } as Record<string, string>
  )[state];
}
function isDraftResponse(value: unknown): value is { workflow: WorkflowDraft } {
  if (!value || typeof value !== "object") return false;
  const workflow = (value as { workflow?: unknown }).workflow;
  if (!workflow || typeof workflow !== "object") return false;
  const candidate = workflow as Partial<WorkflowDraft>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.version === "number" &&
    typeof candidate.checksum === "string" &&
    (candidate.testEvidenceVerified === undefined ||
      typeof candidate.testEvidenceVerified === "boolean") &&
    Boolean(
      candidate.spec &&
      validateContract<WorkflowSpec>("WorkflowSpec", candidate.spec).ok,
    )
  );
}
function isConflictResponse(
  value: unknown,
): value is { workflow: WorkflowDraft } {
  return isDraftResponse(value);
}
function isVersionsResponse(
  value: unknown,
): value is { versions: WorkflowVersion[] } {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as { versions?: unknown }).versions)
  )
    return false;
  return (value as { versions: unknown[] }).versions.every((item) => {
    if (!item || typeof item !== "object") return false;
    const version = item as Partial<WorkflowVersion>;
    return (
      typeof version.id === "string" &&
      typeof version.version === "number" &&
      (version.status === "draft" ||
        version.status === "active" ||
        version.status === "archived") &&
      typeof version.checksum === "string" &&
      (version.testEvidenceRunId === null ||
        typeof version.testEvidenceRunId === "string") &&
      typeof version.createdAt === "string" &&
      (version.publishedAt === null ||
        typeof version.publishedAt === "string") &&
      Boolean(
        version.spec &&
        validateContract<WorkflowSpec>("WorkflowSpec", version.spec).ok,
      )
    );
  });
}
function readError(value: unknown): string {
  return value &&
    typeof value === "object" &&
    typeof (value as { error?: unknown }).error === "string"
    ? (value as { error: string }).error
    : "The workflow request failed.";
}
function isPickerResult(
  value: unknown,
): value is {
  type: "doonce.locator-picker.result";
  stepId: string;
  locator: Extract<
    WorkflowSpec["steps"][number],
    { target: { locator: unknown } }
  >["target"]["locator"];
} {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.type === "doonce.locator-picker.result" &&
    typeof record.stepId === "string" &&
    Boolean(record.locator && typeof record.locator === "object")
  );
}
