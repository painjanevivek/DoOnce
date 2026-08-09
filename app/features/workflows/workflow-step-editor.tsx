"use client";

import type { DragEvent } from "react";
import type {
  WorkflowActionKind,
  WorkflowAssertion,
  WorkflowSpec,
  WorkflowStep,
} from "../../../contracts/protocol";
import type { ContractIssue } from "../../../contracts/validation";
import {
  duplicateWorkflowStep,
  insertWorkflowStep,
  moveWorkflowStep,
  removeWorkflowStep,
} from "./editor-model";
import { EditorField } from "./editor-field";
import { WorkflowAssertionEditor } from "./workflow-assertion-editor";

const actions: Array<{ value: WorkflowActionKind; label: string }> = [
  { value: "navigate", label: "Open page" },
  { value: "wait", label: "Wait for element" },
  { value: "read", label: "Read value" },
  { value: "select", label: "Choose option" },
  { value: "type", label: "Enter value" },
  { value: "download", label: "Download file" },
  { value: "compare", label: "Assert expected result" },
  { value: "branch", label: "Branch on input" },
  { value: "ask-approval", label: "Ask for approval" },
  { value: "stop", label: "Stop" },
];

export function WorkflowStepEditor({
  spec,
  issues,
  onChange,
}: {
  spec: WorkflowSpec;
  issues: ContractIssue[];
  onChange(spec: WorkflowSpec): void;
}) {
  function update(index: number, next: WorkflowStep) {
    onChange({
      ...spec,
      steps: spec.steps.map((step, stepIndex) =>
        stepIndex === index ? next : step,
      ),
    });
  }
  function move(from: number, to: number) {
    onChange(moveWorkflowStep(spec, from, to));
  }
  function drop(event: DragEvent<HTMLElement>, to: number) {
    event.preventDefault();
    const from = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isInteger(from)) move(from, to);
  }

  return (
    <section className="studio-section" aria-labelledby="steps-title">
      <div className="studio-section__heading">
        <div>
          <p className="eyebrow">Workflow sequence</p>
          <h2 id="steps-title">Steps</h2>
          <p>
            Keep the path readable from top to bottom. Branches can only point
            forward, which prevents accidental cycles.
          </p>
        </div>
        <StepMenu
          onInsert={(action) => onChange(insertWorkflowStep(spec, action))}
        />
      </div>
      <ol className="step-stack">
        {spec.steps.map((step, index) => (
          <li
            className="step-card"
            draggable
            key={step.id}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", String(index));
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => drop(event, index)}
          >
            <div className="step-card__rail">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i aria-hidden="true" />
            </div>
            <div className="step-card__body">
              <div className="step-card__heading">
                <div>
                  <span className="action-chip">
                    {actions.find((item) => item.value === step.action)?.label}
                  </span>
                  <strong>{step.name}</strong>
                </div>
                <div className="step-actions">
                  <button
                    aria-label={`Move step ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    type="button"
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Move step ${index + 1} down`}
                    disabled={index === spec.steps.length - 1}
                    onClick={() => move(index, index + 1)}
                    type="button"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => onChange(duplicateWorkflowStep(spec, index))}
                    type="button"
                  >
                    Duplicate
                  </button>
                  <button
                    disabled={spec.steps.length === 1}
                    onClick={() => onChange(removeWorkflowStep(spec, index))}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="editor-grid">
                <EditorField
                  label="Plain-language name"
                  error={firstIssue(issues, `/steps/${index}/name`)}
                >
                  <input
                    maxLength={120}
                    value={step.name}
                    onChange={(event) =>
                      update(index, { ...step, name: event.target.value })
                    }
                  />
                </EditorField>
                <EditorField
                  label="Expected result"
                  error={firstIssue(issues, `/steps/${index}/expectedOutcome`)}
                >
                  <input
                    maxLength={240}
                    value={step.expectedOutcome}
                    onChange={(event) =>
                      update(index, {
                        ...step,
                        expectedOutcome: event.target.value,
                      })
                    }
                  />
                </EditorField>
              </div>
              <StepFields
                index={index}
                issues={issues}
                spec={spec}
                step={step}
                update={(next) => update(index, next)}
              />
              <WorkflowAssertionEditor
                assertions={step.assertions ?? []}
                onChange={(assertions) =>
                  update(index, stepWithAssertions(step, assertions))
                }
                spec={spec}
                title="Verify this step"
              />
              {issuesFor(issues, `/steps/${index}`)
                .filter(
                  (issue) =>
                    !issue.path.endsWith("/name") &&
                    !issue.path.endsWith("/expectedOutcome"),
                )
                .map((issue) => (
                  <p
                    className="field-error"
                    key={`${issue.code}-${issue.path}`}
                  >
                    {issue.message}
                  </p>
                ))}
            </div>
          </li>
        ))}
      </ol>
      <WorkflowAssertionEditor
        assertions={spec.successCriteria ?? []}
        onChange={(assertions) =>
          onChange(specWithSuccessCriteria(spec, assertions))
        }
        spec={spec}
        title="Verify the whole workflow"
      />
    </section>
  );
}

function StepFields({
  index,
  issues,
  spec,
  step,
  update,
}: {
  index: number;
  issues: ContractIssue[];
  spec: WorkflowSpec;
  step: WorkflowStep;
  update(step: WorkflowStep): void;
}) {
  const inputSelect = (
    inputName: string,
    onChange: (value: string) => void,
  ) => (
    <EditorField
      label="Workflow input"
      error={firstIssue(issues, `/steps/${index}/inputName`)}
    >
      <select
        value={inputName}
        onChange={(event) => onChange(event.target.value)}
      >
        {spec.inputs.map((input) => (
          <option key={input.name} value={input.name}>
            {input.label}
          </option>
        ))}
      </select>
    </EditorField>
  );
  if (step.action === "ask-approval")
    return (
      <EditorField label="Question shown to the user">
        <textarea
          maxLength={240}
          value={step.prompt}
          onChange={(event) => update({ ...step, prompt: event.target.value })}
        />
      </EditorField>
    );
  if (step.action === "stop")
    return (
      <EditorField label="Reason for stopping">
        <textarea
          maxLength={240}
          value={step.reason}
          onChange={(event) => update({ ...step, reason: event.target.value })}
        />
      </EditorField>
    );
  if (step.action === "branch")
    return (
      <div className="editor-grid editor-grid--four">
        {inputSelect(step.inputName, (inputName) =>
          update({ ...step, inputName }),
        )}
        <EditorField label="Comparison">
          <select
            value={step.operator}
            onChange={(event) =>
              update({
                ...step,
                operator: event.target.value as typeof step.operator,
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
            maxLength={1000}
            value={step.expected}
            onChange={(event) =>
              update({ ...step, expected: event.target.value })
            }
          />
        </EditorField>
        <EditorField label="When true, go to">
          <select
            value={step.ifTrueStepId}
            onChange={(event) =>
              update({ ...step, ifTrueStepId: event.target.value })
            }
          >
            {spec.steps.slice(index + 1).map((candidate, offset) => (
              <option key={candidate.id} value={candidate.id}>
                Step {index + offset + 2}: {candidate.name}
              </option>
            ))}
          </select>
        </EditorField>
      </div>
    );
  if (step.action === "navigate")
    return <TargetFields step={step} update={update} />;
  if (step.action === "type" || step.action === "select")
    return (
      <>
        <div className="editor-grid">
          {inputSelect(step.inputName, (inputName) =>
            update({ ...step, inputName }),
          )}
          <LocatorConfidence step={step} />
        </div>
        <TargetFields step={step} update={update} />
      </>
    );
  if (step.action === "read")
    return (
      <>
        <EditorField label="Save result as">
          <input
            value={step.outputName}
            onChange={(event) =>
              update({ ...step, outputName: event.target.value })
            }
          />
        </EditorField>
        <TargetFields step={step} update={update} />
      </>
    );
  if (step.action === "wait")
    return (
      <>
        <EditorField label="Maximum wait (milliseconds)">
          <input
            min={100}
            max={60_000}
            type="number"
            value={step.timeoutMs}
            onChange={(event) =>
              update({ ...step, timeoutMs: Number(event.target.value) })
            }
          />
        </EditorField>
        <TargetFields step={step} update={update} />
      </>
    );
  if (step.action === "compare")
    return (
      <>
        <div className="editor-grid">
          <EditorField label="Comparison">
            <select
              value={step.operator}
              onChange={(event) =>
                update({
                  ...step,
                  operator: event.target.value as typeof step.operator,
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
              maxLength={1000}
              value={step.expected}
              onChange={(event) =>
                update({ ...step, expected: event.target.value })
              }
            />
          </EditorField>
        </div>
        <TargetFields step={step} update={update} />
      </>
    );
  return <TargetFields step={step} update={update} />;
}

function TargetFields({
  step,
  update,
}: {
  step: Extract<WorkflowStep, { target: unknown }>;
  update(step: WorkflowStep): void;
}) {
  const pageFields = (
    <div className="editor-grid">
      <EditorField label="Website domain">
        <input
          value={step.target.domain}
          onChange={(event) =>
            update({
              ...step,
              target: { ...step.target, domain: event.target.value },
            } as WorkflowStep)
          }
        />
      </EditorField>
      <EditorField label="Page path">
        <input
          value={step.target.path}
          onChange={(event) =>
            update({
              ...step,
              target: { ...step.target, path: event.target.value },
            } as WorkflowStep)
          }
        />
      </EditorField>
    </div>
  );
  if (!("locator" in step.target))
    return <div className="target-panel">{pageFields}</div>;
  const locator = step.target.locator;
  return (
    <div className="target-panel">
      {pageFields}
      <div className="editor-grid editor-grid--locator">
        <EditorField label="Find element by">
          <select
            value={locator.primary.strategy}
            onChange={(event) =>
              update({
                ...step,
                target: {
                  ...step.target,
                  locator: {
                    ...locator,
                    primary: {
                      ...locator.primary,
                      strategy: event.target
                        .value as typeof locator.primary.strategy,
                    },
                  },
                },
              } as WorkflowStep)
            }
          >
            <option value="role">Accessible role</option>
            <option value="label">Field label</option>
            <option value="capture-id">Capture identifier</option>
            <option value="id">Element ID</option>
            <option value="text">Visible text</option>
          </select>
        </EditorField>
        <EditorField label="Element description">
          <input
            maxLength={256}
            value={locator.primary.value}
            onChange={(event) =>
              update({
                ...step,
                target: {
                  ...step.target,
                  locator: {
                    ...locator,
                    primary: { ...locator.primary, value: event.target.value },
                  },
                },
              } as WorkflowStep)
            }
          />
        </EditorField>
        <button
          className="secondary-button picker-button"
          onClick={() =>
            window.postMessage(
              { type: "doonce.locator-picker.request", stepId: step.id },
              window.location.origin,
            )
          }
          type="button"
        >
          Pick in browser
        </button>
      </div>
    </div>
  );
}

function LocatorConfidence({
  step,
}: {
  step: Extract<WorkflowStep, { target: { locator: unknown } }>;
}) {
  const confidence = step.target.locator.primary.confidence;
  return (
    <div
      className={`confidence confidence--${confidence >= 0.8 ? "high" : confidence >= 0.55 ? "medium" : "low"}`}
    >
      <span>Target confidence</span>
      <strong>
        {confidence >= 0.8
          ? "Strong"
          : confidence >= 0.55
            ? "Review suggested"
            : "Needs attention"}
      </strong>
      <small>{Math.round(confidence * 100)}% from the recording</small>
    </div>
  );
}
function StepMenu({
  onInsert,
}: {
  onInsert(action: WorkflowActionKind): void;
}) {
  return (
    <label className="step-menu">
      <span>Add a step</span>
      <select
        defaultValue=""
        onChange={(event) => {
          if (event.target.value)
            onInsert(event.target.value as WorkflowActionKind);
          event.target.value = "";
        }}
      >
        <option value="">Search supported steps…</option>
        {actions.map((action) => (
          <option key={action.value} value={action.value}>
            {action.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function issuesFor(issues: ContractIssue[], prefix: string) {
  return issues.filter(
    (issue) => issue.path === prefix || issue.path.startsWith(`${prefix}/`),
  );
}
function firstIssue(issues: ContractIssue[], prefix: string) {
  return issuesFor(issues, prefix)[0]?.message;
}
function stepWithAssertions(
  step: WorkflowStep,
  assertions: WorkflowAssertion[],
): WorkflowStep {
  if (assertions.length > 0) return { ...step, assertions };
  const { assertions: removed, ...next } = step;
  void removed;
  return next as WorkflowStep;
}
function specWithSuccessCriteria(
  spec: WorkflowSpec,
  successCriteria: WorkflowAssertion[],
): WorkflowSpec {
  if (successCriteria.length > 0) return { ...spec, successCriteria };
  const { successCriteria: removed, ...next } = spec;
  void removed;
  return next;
}
