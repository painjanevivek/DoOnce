import type { LocatorSpec, WorkflowSpec, WorkflowStep } from "../../../contracts/protocol";

const actionLabels: Record<WorkflowStep["action"], string> = {
  navigate: "Open page",
  wait: "Wait for page",
  read: "Read value",
  select: "Choose option",
  type: "Enter value",
  download: "Download file",
  compare: "Compare values",
  "ask-approval": "Request approval",
  stop: "Stop workflow",
};

export interface WorkflowStepPreview {
  id: string;
  action: string;
  name: string;
  expectedOutcome: string;
  target?: string;
  locatorStrategies: string[];
}

export interface WorkflowSpecPreviewModel {
  title: string;
  summary: string;
  domains: string[];
  inputs: string[];
  steps: WorkflowStepPreview[];
}

export function buildWorkflowSpecPreview(spec: WorkflowSpec): WorkflowSpecPreviewModel {
  return {
    title: spec.title,
    summary: `${spec.steps.length} ${spec.steps.length === 1 ? "step" : "steps"} · schema v${spec.schemaVersion}`,
    domains: [...spec.allowedDomains],
    inputs: spec.inputs.map((input) => `${input.label} (${input.kind}${input.required ? ", required" : ""})`),
    steps: spec.steps.map((step) => ({
      id: step.id,
      action: actionLabels[step.action],
      name: step.name,
      expectedOutcome: step.expectedOutcome,
      ...targetPreview(step),
      locatorStrategies: locatorStrategies(step),
    })),
  };
}

export function WorkflowSpecPreview({ spec }: { spec: WorkflowSpec }) {
  const preview = buildWorkflowSpecPreview(spec);

  return (
    <article className="workflow-spec-preview" aria-labelledby="imported-workflow-title">
      <header>
        <div>
          <p className="eyebrow">Validated workflow draft</p>
          <h3 id="imported-workflow-title">{preview.title}</h3>
        </div>
        <span>{preview.summary}</span>
      </header>
      <dl className="workflow-spec-facts">
        <div><dt>Approved domains</dt><dd>{preview.domains.join(", ")}</dd></div>
        <div><dt>Inputs</dt><dd>{preview.inputs.length ? preview.inputs.join(", ") : "No user inputs"}</dd></div>
      </dl>
      <ol className="workflow-spec-steps">
        {preview.steps.map((step, index) => (
          <li key={step.id}>
            <details>
              <summary><b>{index + 1}</b><span><strong>{step.name}</strong><small>{step.action}</small></span></summary>
              <div>
                <p><strong>Expected result</strong>{step.expectedOutcome}</p>
                {step.target && <p><strong>Page</strong>{step.target}</p>}
                <p><strong>Targeting</strong>{step.locatorStrategies.length ? step.locatorStrategies.join(" → ") : "No page element required"}</p>
              </div>
            </details>
          </li>
        ))}
      </ol>
      <p className="workflow-spec-note">This is a local review preview. Importing it does not save, publish, or run the workflow.</p>
    </article>
  );
}

function targetPreview(step: WorkflowStep): { target?: string } {
  if (!("target" in step)) return {};
  return { target: `${step.target.domain}${step.target.path}` };
}

function locatorStrategies(step: WorkflowStep): string[] {
  if (!("target" in step) || !("locator" in step.target)) return [];
  return describeLocator(step.target.locator);
}

function describeLocator(locator: LocatorSpec): string[] {
  return [locator.primary, ...locator.fallbacks]
    .sort((left, right) => right.confidence - left.confidence)
    .map((candidate) => `${candidate.strategy} (${Math.round(candidate.confidence * 100)}%)`);
}
