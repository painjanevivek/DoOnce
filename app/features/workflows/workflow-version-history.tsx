"use client";

import type { WorkflowSpec } from "../../../contracts/protocol";
import type { WorkflowVersion } from "./authoring-types";
import { describeVersionChanges } from "./editor-model";

export function WorkflowVersionHistory({
  versions,
  draft,
}: {
  versions: WorkflowVersion[];
  draft: WorkflowSpec;
}) {
  const active = versions.find((version) => version.status === "active");
  const changes = describeVersionChanges(active?.spec, draft);
  return (
    <section className="studio-section" aria-labelledby="history-title">
      <div className="studio-section__heading">
        <div>
          <p className="eyebrow">Readable comparison</p>
          <h2 id="history-title">Version history</h2>
          <p>
            Review what changed before publication. Published definitions stay
            immutable and remain linked to their passing test.
          </p>
        </div>
      </div>
      <div className="version-compare">
        <div>
          <span>Current draft</span>
          <strong>{draft.title}</strong>
          <ul>
            {changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </div>
        {active ? (
          <div>
            <span>Active version {active.version}</span>
            <strong>{active.spec.title}</strong>
            <small>
              Published{" "}
              {active.publishedAt
                ? new Date(active.publishedAt).toLocaleString()
                : "previously"}
            </small>
            <small>
              {active.testEvidenceRunId
                ? `Verified by test ${active.testEvidenceRunId.slice(0, 8)}`
                : "Legacy version without linked test evidence"}
            </small>
          </div>
        ) : (
          <div>
            <span>No active version</span>
            <strong>This will be the first publication.</strong>
          </div>
        )}
      </div>
      <details className="version-history">
        <summary>Show all versions ({versions.length})</summary>
        <ol>
          {versions.map((version) => (
            <li key={version.version}>
              <span>
                <strong>Version {version.version}</strong>
                <small>{new Date(version.createdAt).toLocaleString()}</small>
                <small>
                  {version.testEvidenceRunId
                    ? `Test evidence ${version.testEvidenceRunId.slice(0, 8)}`
                    : "No matching test evidence"}
                </small>
              </span>
              <b data-status={version.status}>{version.status}</b>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
