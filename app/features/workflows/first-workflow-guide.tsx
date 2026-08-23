"use client";

import Link from "next/link";
import type { WorkflowSummary } from "./authoring-types";

type FirstWorkflowStage = "teach" | "review" | "verify" | "repeat";

interface FirstWorkflowProgress {
  stage: FirstWorkflowStage;
  completed: number;
  workflow?: WorkflowSummary;
}

interface FirstWorkflowGuideProps {
  workflows: WorkflowSummary[];
  onChooseRecording(): void;
  onOpenWorkflow(workflow: WorkflowSummary): void;
  onRun(workflow: WorkflowSummary): void;
}

const steps = [
  {
    id: "browser",
    label: "Prepare the browser",
    note: "Install and pair the extension, then approve only the site you intend to demonstrate.",
  },
  {
    id: "teach",
    label: "Teach one bounded task",
    note: "Record one careful run, describe it, or upload a walkthrough.",
  },
  {
    id: "review",
    label: "Review and test the exact draft",
    note: "Inspect every step and verify the expected outcome before publishing.",
  },
  {
    id: "verify",
    label: "Run the published version",
    note: "A run counts only when its declared outcome and artifact are verified.",
  },
] as const;

export function deriveFirstWorkflowProgress(
  workflows: WorkflowSummary[],
): FirstWorkflowProgress {
  const verified = workflows.find(
    (workflow) => workflow.activeVersion && workflow.lastRunAt,
  );
  if (verified) return { stage: "repeat", completed: 4, workflow: verified };

  const active = workflows.find((workflow) => workflow.activeVersion);
  if (active) return { stage: "verify", completed: 3, workflow: active };

  const draft = workflows.find((workflow) => workflow.draftVersion);
  if (draft) return { stage: "review", completed: 2, workflow: draft };

  return { stage: "teach", completed: 0 };
}

export function FirstWorkflowGuide({
  workflows,
  onChooseRecording,
  onOpenWorkflow,
  onRun,
}: FirstWorkflowGuideProps) {
  const progress = deriveFirstWorkflowProgress(workflows);
  const isComplete = progress.stage === "repeat";

  return (
    <section
      className="first-workflow-guide"
      aria-labelledby="first-workflow-title"
      data-stage={progress.stage}
    >
      <div className="first-workflow-guide__intro">
        <p className="product-kicker">
          {isComplete ? "First workflow verified" : "First workflow"}
        </p>
        <h2 id="first-workflow-title">
          {isComplete
            ? "Your proof loop is complete."
            : "One clear next step, with the proof visible."}
        </h2>
        <p>
          {isComplete
            ? "The published workflow has produced a recorded run. Review the receipt before treating it as recurring work."
            : "DoOnce keeps browser setup, authoring, exact-draft testing, and the verified run as separate decisions."}
        </p>
        <div className="first-workflow-guide__actions">
          {progress.stage === "teach" ? (
            <button onClick={onChooseRecording} type="button">
              Choose browser recording
            </button>
          ) : progress.stage === "review" && progress.workflow ? (
            <button onClick={() => onOpenWorkflow(progress.workflow!)} type="button">
              Review and test draft
            </button>
          ) : progress.workflow ? (
            <button onClick={() => onRun(progress.workflow!)} type="button">
              {isComplete ? "Run verified workflow again" : "Run published version"}
            </button>
          ) : null}
          <Link href="/install">Review install and pairing</Link>
        </div>
        <small>
          Pairing and site approval are confirmed inside the extension; this page does not infer either state.
        </small>
      </div>

      <ol className="first-workflow-guide__steps" aria-label="First workflow progress">
        {steps.map((step, index) => {
          const complete = index < progress.completed;
          const current = !isComplete && index === progress.completed;
          return (
            <li data-complete={complete} data-current={current} key={step.id}>
              <span aria-hidden="true">{index + 1}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.note}</p>
              </div>
              <small>{complete ? "Complete" : current ? "Next" : "Later"}</small>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
