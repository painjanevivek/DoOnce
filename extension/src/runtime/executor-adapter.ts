import type { LocatorCandidate, PageState, WorkflowActionKind, WorkflowStep } from "../../../contracts/protocol";

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
}

export interface ExecutorAdapter {
  capabilities(): ExecutorCapabilities;
  prepare(context: ExecutionContext): Promise<void>;
  execute(step: WorkflowStep, context: ExecutionContext): Promise<ActionExecutionResult>;
  evidence?(step: WorkflowStep, result: ActionExecutionResult): Promise<string[]>;
  cancel(reason: string): Promise<void>;
  close(): Promise<void>;
}
