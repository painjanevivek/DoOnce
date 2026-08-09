import type { AssertionResult, LocatorCandidate, PageState, WorkflowActionKind, WorkflowAssertion, WorkflowStep } from "../../../contracts/protocol";

export interface ExecutorCapabilities {
  executor: "extension";
  actions: WorkflowActionKind[];
  maxSteps: number;
  supportsDownloads: boolean;
  features: string[];
}

export interface ExecutionContext {
  runId: string;
  inputs: Readonly<Record<string, string>>;
  variables: Readonly<Record<string, string>>;
}

export interface ActionExecutionResult {
  status: "verified" | "paused" | "failed";
  reasonCode?: string;
  retryable?: boolean;
  selectedLocator?: LocatorCandidate;
  locatorConfidence?: number;
  outputs?: Record<string, string>;
  evidenceRefs?: string[];
  observedPage?: PageState;
  repairCandidates?: LocatorCandidate[];
}

export interface ExecutorAdapter {
  capabilities(): ExecutorCapabilities;
  prepare(context: ExecutionContext): Promise<void>;
  execute(step: WorkflowStep, context: ExecutionContext): Promise<ActionExecutionResult>;
  verify(assertions: readonly WorkflowAssertion[], context: ExecutionContext): Promise<AssertionResult[]>;
  evidence?(step: WorkflowStep, result: ActionExecutionResult): Promise<string[]>;
  cancel(reason: string): Promise<void>;
  close(): Promise<void>;
}
