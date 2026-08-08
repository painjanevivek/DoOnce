import type { CatalogState, WorkflowReview } from "./contracts";

interface WorkflowDraftReviewProps {
  canAuthor: boolean;
  draft: WorkflowReview;
  previewState: "idle" | "running" | "passed";
  state: CatalogState;
  workflowChangesEnabled: boolean;
  onPreview(): void;
  onPublish(): void;
}

export function WorkflowDraftReview({ canAuthor, draft, onPreview, onPublish, previewState, state, workflowChangesEnabled }: WorkflowDraftReviewProps) {
  return (
    <aside className="workflow-review" aria-label="Draft review">
      <strong>Server-confirmed draft · version {draft.version}</strong>
      <span>{draft.title}</span>
      <div className="workflow-review-details">
        <p><b>Approved domain:</b> {draft.allowedDomains.join(", ")}</p>
        <ol>
          {draft.steps.map((step) => <li key={step.id}><b>{step.kind}</b> — {step.name}<small>{step.domain}{step.path} · {step.expectedOutcome}</small></li>)}
        </ol>
        <p>{previewState === "passed" ? "Capability preview passed." : "Run a server capability preview before publishing."}</p>
        <p>{draft.testRunVerified ? "A completed local test receipt is confirmed for this version." : "Import and confirm one completed local test receipt before publishing."}</p>
      </div>
      <div className="workflow-review-actions">
        <button disabled={!workflowChangesEnabled || !canAuthor || previewState === "running" || state === "publishing"} onClick={onPreview} type="button">{previewState === "running" ? "Checking capabilities…" : "Run capability preview"}</button>
        <button disabled={!workflowChangesEnabled || !canAuthor || previewState !== "passed" || !draft.testRunVerified || state === "publishing"} onClick={onPublish} type="button">Publish reviewed draft</button>
      </div>
    </aside>
  );
}
