"use client";

import type {
  WorkflowAssertion,
  WorkflowSpec,
} from "../../../contracts/protocol";
import { EditorField } from "./editor-field";

const kinds: Array<{ value: WorkflowAssertion["kind"]; label: string }> = [
  { value: "url-match", label: "Page URL matches" },
  { value: "element-present", label: "Element is present" },
  { value: "element-absent", label: "Element is absent" },
  { value: "text-match", label: "Text matches" },
  { value: "field-state", label: "Field has value" },
  { value: "file-downloaded", label: "File was downloaded" },
  { value: "extracted-value", label: "Extracted value matches" },
  { value: "table-row-count", label: "Table row count" },
  { value: "user-confirmation", label: "User confirms outcome" },
];

export function WorkflowAssertionEditor({
  title,
  spec,
  assertions,
  onChange,
}: {
  title: string;
  spec: WorkflowSpec;
  assertions: WorkflowAssertion[];
  onChange(assertions: WorkflowAssertion[]): void;
}) {
  function update(index: number, assertion: WorkflowAssertion) {
    onChange(
      assertions.map((current, currentIndex) =>
        currentIndex === index ? assertion : current,
      ),
    );
  }
  return (
    <details className="assertion-editor">
      <summary>
        {title} <span>{assertions.length}</span>
      </summary>
      <div className="assertion-editor__body">
        <p>
          Actions and verification are separate. A run only continues when these
          observable checks pass.
        </p>
        {assertions.map((assertion, index) => (
          <div className="assertion-row" key={assertion.id}>
            <div className="assertion-row__heading">
              <strong>{assertion.name}</strong>
              <button
                onClick={() =>
                  onChange(assertions.filter((_, current) => current !== index))
                }
                type="button"
              >
                Remove
              </button>
            </div>
            <div className="editor-grid">
              <EditorField label="Check name">
                <input
                  maxLength={120}
                  value={assertion.name}
                  onChange={(event) =>
                    update(index, { ...assertion, name: event.target.value })
                  }
                />
              </EditorField>
              <EditorField label="Check type">
                <select
                  value={assertion.kind}
                  onChange={(event) =>
                    update(
                      index,
                      createAssertion(
                        event.target.value as WorkflowAssertion["kind"],
                        spec,
                      ),
                    )
                  }
                >
                  {kinds.map((kind) => (
                    <option key={kind.value} value={kind.value}>
                      {kind.label}
                    </option>
                  ))}
                </select>
              </EditorField>
            </div>
            <AssertionFields
              assertion={assertion}
              outputs={spec.steps.flatMap((step) =>
                step.action === "read" ? [step.outputName] : [],
              )}
              update={(next) => update(index, next)}
            />
          </div>
        ))}
        <label className="step-menu">
          <span>Add verification</span>
          <select
            defaultValue=""
            onChange={(event) => {
              if (event.target.value)
                onChange([
                  ...assertions,
                  createAssertion(
                    event.target.value as WorkflowAssertion["kind"],
                    spec,
                  ),
                ]);
              event.target.value = "";
            }}
          >
            <option value="">Choose an observable check…</option>
            {kinds.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </details>
  );
}

function AssertionFields({
  assertion,
  outputs,
  update,
}: {
  assertion: WorkflowAssertion;
  outputs: string[];
  update(assertion: WorkflowAssertion): void;
}) {
  if (assertion.kind === "user-confirmation")
    return (
      <EditorField label="Confirmation question">
        <input
          maxLength={240}
          value={assertion.prompt}
          onChange={(event) =>
            update({ ...assertion, prompt: event.target.value })
          }
        />
      </EditorField>
    );
  if (assertion.kind === "file-downloaded")
    return (
      <div className="editor-grid editor-grid--four">
        <EditorField label="File name pattern">
          <input
            value={assertion.fileNamePattern ?? ""}
            onChange={(event) =>
              update(
                withDownloadField(
                  assertion,
                  "fileNamePattern",
                  event.target.value || undefined,
                ),
              )
            }
          />
        </EditorField>
        <EditorField label="Content type">
          <input
            placeholder="text/csv"
            value={assertion.contentTypes?.[0] ?? ""}
            onChange={(event) =>
              update(
                withDownloadField(
                  assertion,
                  "contentTypes",
                  event.target.value ? [event.target.value] : undefined,
                ),
              )
            }
          />
        </EditorField>
        <EditorField label="Minimum bytes">
          <input
            min={0}
            type="number"
            value={assertion.minBytes ?? ""}
            onChange={(event) =>
              update(
                withDownloadField(
                  assertion,
                  "minBytes",
                  event.target.value ? Number(event.target.value) : undefined,
                ),
              )
            }
          />
        </EditorField>
        <EditorField label="Maximum bytes">
          <input
            min={0}
            type="number"
            value={assertion.maxBytes ?? ""}
            onChange={(event) =>
              update(
                withDownloadField(
                  assertion,
                  "maxBytes",
                  event.target.value ? Number(event.target.value) : undefined,
                ),
              )
            }
          />
        </EditorField>
      </div>
    );
  if (assertion.kind === "table-row-count")
    return (
      <>
        <Target assertion={assertion} update={update} />
        <div className="editor-grid">
          <EditorField label="Count rule">
            <select
              value={assertion.operator}
              onChange={(event) =>
                update({
                  ...assertion,
                  operator: event.target.value as typeof assertion.operator,
                })
              }
            >
              <option value="equals">Exactly</option>
              <option value="at-least">At least</option>
              <option value="at-most">At most</option>
            </select>
          </EditorField>
          <EditorField label="Rows">
            <input
              min={0}
              type="number"
              value={assertion.count}
              onChange={(event) =>
                update({ ...assertion, count: Number(event.target.value) })
              }
            />
          </EditorField>
        </div>
      </>
    );
  if (assertion.kind === "element-present")
    return <Target assertion={assertion} update={update} />;
  if (assertion.kind === "element-absent")
    return <Target assertion={assertion} update={update} />;
  if (assertion.kind === "extracted-value")
    return (
      <div className="editor-grid editor-grid--four">
        <EditorField label="Saved output">
          <select
            value={assertion.outputName}
            onChange={(event) =>
              update({ ...assertion, outputName: event.target.value })
            }
          >
            {outputs.map((output) => (
              <option key={output}>{output}</option>
            ))}
          </select>
        </EditorField>
        <MatchFields assertion={assertion} update={update} />
      </div>
    );
  if (assertion.kind === "url-match")
    return (
      <div className="editor-grid">
        <MatchFields assertion={assertion} update={update} />
      </div>
    );
  if (assertion.kind === "text-match")
    return (
      <>
        <Target assertion={assertion} update={update} />
        <div className="editor-grid">
          <MatchFields assertion={assertion} update={update} />
        </div>
      </>
    );
  if (assertion.kind === "field-state")
    return (
      <>
        <Target assertion={assertion} update={update} />
        <div className="editor-grid">
          <MatchFields assertion={assertion} update={update} />
        </div>
      </>
    );
  return null;
}

function MatchFields({
  assertion,
  update,
}: {
  assertion: Extract<
    WorkflowAssertion,
    { operator: "equals" | "contains" | "matches" }
  >;
  update(assertion: WorkflowAssertion): void;
}) {
  return (
    <>
      <EditorField label="Comparison">
        <select
          value={assertion.operator}
          onChange={(event) =>
            update({
              ...assertion,
              operator: event.target.value as typeof assertion.operator,
            })
          }
        >
          <option value="equals">Equals</option>
          <option value="contains">Contains</option>
          <option value="matches">Matches pattern</option>
        </select>
      </EditorField>
      <EditorField label="Expected value">
        <input
          maxLength={2048}
          value={assertion.expected}
          onChange={(event) =>
            update({ ...assertion, expected: event.target.value })
          }
        />
      </EditorField>
    </>
  );
}
function Target({
  assertion,
  update,
}: {
  assertion: Extract<WorkflowAssertion, { target: unknown }>;
  update(assertion: WorkflowAssertion): void;
}) {
  return (
    <div className="editor-grid editor-grid--four">
      <EditorField label="Domain">
        <input
          value={assertion.target.domain}
          onChange={(event) =>
            update({
              ...assertion,
              target: { ...assertion.target, domain: event.target.value },
            } as WorkflowAssertion)
          }
        />
      </EditorField>
      <EditorField label="Path">
        <input
          value={assertion.target.path}
          onChange={(event) =>
            update({
              ...assertion,
              target: { ...assertion.target, path: event.target.value },
            } as WorkflowAssertion)
          }
        />
      </EditorField>
      <EditorField label="Locator type">
        <select
          value={assertion.target.locator.primary.strategy}
          onChange={(event) =>
            update({
              ...assertion,
              target: {
                ...assertion.target,
                locator: {
                  ...assertion.target.locator,
                  primary: {
                    ...assertion.target.locator.primary,
                    strategy: event.target
                      .value as typeof assertion.target.locator.primary.strategy,
                  },
                },
              },
            } as WorkflowAssertion)
          }
        >
          <option value="id">Element ID</option>
          <option value="capture-id">Capture ID</option>
          <option value="role">Role</option>
          <option value="label">Label</option>
          <option value="text">Text</option>
        </select>
      </EditorField>
      <EditorField label="Element">
        <input
          value={assertion.target.locator.primary.value}
          onChange={(event) =>
            update({
              ...assertion,
              target: {
                ...assertion.target,
                locator: {
                  ...assertion.target.locator,
                  primary: {
                    ...assertion.target.locator.primary,
                    value: event.target.value,
                  },
                },
              },
            } as WorkflowAssertion)
          }
        />
      </EditorField>
    </div>
  );
}

function createAssertion(
  kind: WorkflowAssertion["kind"],
  spec: WorkflowSpec,
): WorkflowAssertion {
  const base = {
    id: crypto.randomUUID(),
    name: kinds.find((item) => item.value === kind)?.label ?? "Verify outcome",
  };
  const target = {
    domain: spec.allowedDomains[0] ?? "localhost",
    path: "/",
    locator: {
      schemaVersion: 1 as const,
      primary: { strategy: "id" as const, value: "result", confidence: 0.5 },
      fallbacks: [],
    },
  };
  if (kind === "url-match")
    return { ...base, kind, operator: "contains", expected: "/" };
  if (kind === "element-present" || kind === "element-absent")
    return { ...base, kind, target };
  if (kind === "text-match" || kind === "field-state")
    return { ...base, kind, target, operator: "contains", expected: "" };
  if (kind === "file-downloaded") return { ...base, kind };
  if (kind === "extracted-value")
    return {
      ...base,
      kind,
      outputName:
        spec.steps.find((step) => step.action === "read")?.outputName ??
        "result",
      operator: "equals",
      expected: "",
    };
  if (kind === "table-row-count")
    return { ...base, kind, target, operator: "at-least", count: 1 };
  return {
    ...base,
    kind: "user-confirmation",
    prompt: "Does the result look correct?",
  };
}
type DownloadAssertion = Extract<
  WorkflowAssertion,
  { kind: "file-downloaded" }
>;
type DownloadField =
  "fileNamePattern" | "contentTypes" | "minBytes" | "maxBytes";
function withDownloadField(
  assertion: DownloadAssertion,
  key: DownloadField,
  value: string | string[] | number | undefined,
): DownloadAssertion {
  const next: DownloadAssertion = { ...assertion };
  if (value === undefined) delete next[key];
  else Object.assign(next, { [key]: value });
  return next;
}
