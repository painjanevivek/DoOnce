export type PilotProofState = "complete" | "current" | "pending" | "blocked";

export type PilotProofStep = {
  description: string;
  label: string;
  state: PilotProofState;
};

const defaultSteps: PilotProofStep[] = [
  {
    label: "Approved origin",
    description: "The exact pilot site is confirmed.",
    state: "pending",
  },
  {
    label: "Extension connected",
    description: "Chrome is paired to this workspace.",
    state: "pending",
  },
  {
    label: "Workflow ready",
    description: "A reviewed version is available.",
    state: "pending",
  },
  {
    label: "Run approved",
    description: "The participant approved one fresh run.",
    state: "pending",
  },
  {
    label: "File verified",
    description: "The expected report passed its contract checks.",
    state: "pending",
  },
  {
    label: "Receipt recorded",
    description: "The immutable run receipt is available.",
    state: "pending",
  },
];

type PilotProofRailProps = {
  steps?: PilotProofStep[];
  title?: string;
};

/**
 * A stable, presentational proof path for attended runs. Callers supply only
 * server-confirmed states; this component never infers readiness on its own.
 */
export function PilotProofRail({
  steps = defaultSteps,
  title = "Pilot proof path",
}: PilotProofRailProps) {
  return (
    <section className="pilot-proof-rail" aria-labelledby="pilot-proof-rail-title">
      <header>
        <p className="product-kicker">Attended report workflow</p>
        <h2 id="pilot-proof-rail-title">{title}</h2>
      </header>
      <ol>
        {steps.map((step) => (
          <li data-state={step.state} key={step.label}>
            <span className="pilot-proof-rail__marker" aria-hidden="true" />
            <div>
              <strong>{step.label}</strong>
              <small>{step.description}</small>
            </div>
            <span className="pilot-proof-rail__state">{step.state}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
