import type { ContractIssue } from "../../../contracts/validation";
import { validateContract } from "../../../contracts/validation";
import type { WorkflowActionKind, WorkflowInputDefinition, WorkflowSpec, WorkflowStep } from "../../../contracts/protocol";

export interface EditorHistory { snapshots: WorkflowSpec[]; index: number }

export function createEditorHistory(spec: WorkflowSpec): EditorHistory { return { snapshots: [clone(spec)], index: 0 }; }

export function applyEditorChange(history: EditorHistory, spec: WorkflowSpec): EditorHistory {
  const snapshots = [...history.snapshots.slice(0, history.index + 1), clone(spec)].slice(-50);
  return { snapshots, index: snapshots.length - 1 };
}

export function undoEditorChange(history: EditorHistory): EditorHistory { return { ...history, index: Math.max(0, history.index - 1) }; }
export function redoEditorChange(history: EditorHistory): EditorHistory { return { ...history, index: Math.min(history.snapshots.length - 1, history.index + 1) }; }
export function currentEditorSpec(history: EditorHistory): WorkflowSpec { return history.snapshots[history.index]!; }

export function validateEditorSpec(spec: WorkflowSpec): ContractIssue[] {
  const validation = validateContract<WorkflowSpec>("WorkflowSpec", spec);
  return validation.ok ? [] : validation.errors;
}

export function moveWorkflowStep(spec: WorkflowSpec, from: number, to: number): WorkflowSpec {
  if (from === to || from < 0 || to < 0 || from >= spec.steps.length || to >= spec.steps.length) return spec;
  const steps = [...spec.steps];
  const [step] = steps.splice(from, 1);
  if (!step) return spec;
  steps.splice(to, 0, step);
  return { ...spec, steps };
}

export function duplicateWorkflowStep(spec: WorkflowSpec, index: number): WorkflowSpec {
  const source = spec.steps[index];
  if (!source || spec.steps.length >= 100) return spec;
  const copy = { ...clone(source), id: crypto.randomUUID(), name: `${source.name} copy` } as WorkflowStep;
  const steps = [...spec.steps];
  steps.splice(index + 1, 0, copy);
  return { ...spec, steps };
}

export function removeWorkflowStep(spec: WorkflowSpec, index: number): WorkflowSpec {
  if (spec.steps.length <= 1) return spec;
  return { ...spec, steps: spec.steps.filter((_, stepIndex) => stepIndex !== index) };
}

export function insertWorkflowStep(spec: WorkflowSpec, action: WorkflowActionKind): WorkflowSpec {
  const domain = spec.allowedDomains[0] ?? "localhost";
  const base = { id: crypto.randomUUID(), action, name: actionName(action), expectedOutcome: actionOutcome(action) };
  const target = { domain, path: "/", locator: defaultLocator() };
  let inputs = spec.inputs;
  let step: WorkflowStep;
  switch (action) {
    case "navigate": step = { ...base, action, target: { domain, path: "/" } }; break;
    case "wait": step = { ...base, action, target, timeoutMs: 10_000 }; break;
    case "read": step = { ...base, action, target, outputName: uniqueName("result", spec) }; break;
    case "select":
    case "type": {
      if (!inputs[0]) inputs = [...inputs, { name: "input_value", label: "Input value", kind: "text", required: true }];
      step = { ...base, action, target, inputName: inputs[0]!.name };
      break;
    }
    case "download": step = { ...base, action, target }; break;
    case "compare": step = { ...base, action, target, operator: "contains", expected: "" }; break;
    case "branch": {
      if (!inputs[0]) inputs = [...inputs, { name: "condition_value", label: "Condition value", kind: "text", required: true }];
      const destination = spec.steps[0]?.id;
      if (!destination) return spec;
      step = { ...base, action, inputName: inputs[0]!.name, operator: "equals", expected: "", ifTrueStepId: destination };
      return { ...spec, inputs, steps: [step, ...spec.steps] };
    }
    case "ask-approval": step = { ...base, action, prompt: "Continue this workflow?" }; break;
    case "stop": step = { ...base, action, reason: "Stop at this checkpoint." }; break;
  }
  return { ...spec, inputs, steps: [...spec.steps, step] };
}

export function addWorkflowInput(spec: WorkflowSpec): WorkflowSpec {
  if (spec.inputs.length >= 20) return spec;
  const input: WorkflowInputDefinition = { name: uniqueName("input", spec), label: "New input", kind: "text", required: false };
  return { ...spec, inputs: [...spec.inputs, input] };
}

export function describeVersionChanges(previous: WorkflowSpec | undefined, current: WorkflowSpec): string[] {
  if (!previous) return ["Initial workflow version"];
  const changes: string[] = [];
  if (previous.title !== current.title) changes.push(`Renamed “${previous.title}” to “${current.title}”`);
  if (previous.description !== current.description) changes.push("Changed the workflow purpose");
  if (previous.steps.length !== current.steps.length) changes.push(`Changed steps from ${previous.steps.length} to ${current.steps.length}`);
  if (previous.inputs.length !== current.inputs.length) changes.push(`Changed inputs from ${previous.inputs.length} to ${current.inputs.length}`);
  const reordered = previous.steps.map((step) => step.id).join() !== current.steps.map((step) => step.id).join();
  if (reordered && previous.steps.length === current.steps.length) changes.push("Reordered or replaced workflow steps");
  const edited = current.steps.filter((step, index) => JSON.stringify(step) !== JSON.stringify(previous.steps[index])).length;
  if (edited > 0) changes.push(`Updated ${edited} step${edited === 1 ? "" : "s"}`);
  return changes.length > 0 ? changes : ["No definition changes"];
}

function defaultLocator() { return { schemaVersion: 1 as const, primary: { strategy: "role" as const, value: "button", confidence: .5 }, fallbacks: [] }; }
function clone<T>(value: T): T { return structuredClone(value); }
function uniqueName(base: string, spec: WorkflowSpec): string {
  const names = new Set([...spec.inputs.map((input) => input.name), ...spec.steps.flatMap((step) => step.action === "read" ? [step.outputName] : [])]);
  let candidate = base;
  let suffix = 2;
  while (names.has(candidate)) candidate = `${base}_${suffix++}`;
  return candidate;
}
function actionName(action: WorkflowActionKind): string { return ({ navigate: "Open a page", wait: "Wait for an element", read: "Read a value", select: "Choose an option", type: "Enter a value", download: "Download a file", compare: "Check an expected result", branch: "Choose the next path", "ask-approval": "Ask for approval", stop: "Stop the workflow" })[action]; }
function actionOutcome(action: WorkflowActionKind): string { return ({ navigate: "The page is ready", wait: "The element becomes available", read: "The value is captured", select: "The option is selected", type: "The value is entered", download: "The download starts", compare: "The expected result is confirmed", branch: "The matching path is selected", "ask-approval": "A person decides whether to continue", stop: "The workflow stops clearly" })[action]; }
