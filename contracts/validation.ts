import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020";
import addFormatsModule from "ajv-formats";
import protocolSchema from "./protocol.v1.schema.json";
import type { WorkflowCompilation, WorkflowSpec } from "./protocol";

export type ContractName = "WorkflowSpec" | "LocatorSpec" | "WorkflowInputDefinition" | "RuntimeCapabilities" | "CaptureSession" | "CaptureSessionSummary" | "RecordedAction" | "CaptureHandshake" | "CaptureSyncRequest" | "CaptureSyncAck" | "WorkflowCompilation" | "RunRequest" | "StepResult" | "RunResult" | "RepairProposal" | "ExtensionMessage" | "ApiError";
export interface ContractIssue { code: string; path: string; message: string }

const schemaId = "https://doonce.dev/schemas/protocol.v1.schema.json";
const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
const addFormats = addFormatsModule as unknown as (instance: Ajv2020) => Ajv2020;
addFormats(ajv);
ajv.addSchema(protocolSchema, schemaId);
const validators = new Map<ContractName, ValidateFunction>();

export function validateContract<T>(name: ContractName, input: unknown): { ok: true; value: T } | { ok: false; errors: ContractIssue[] } {
  let validator = validators.get(name);
  if (!validator) {
    validator = ajv.compile({ $ref: `${schemaId}#/$defs/${name}` });
    validators.set(name, validator);
  }
  if (!validator(input)) return { ok: false, errors: (validator.errors ?? []).map(mapIssue) };
  if (name === "WorkflowSpec") {
    const semantic = workflowSemanticIssues(input as WorkflowSpec);
    if (semantic.length > 0) return { ok: false, errors: semantic };
  }
  if (name === "WorkflowCompilation") {
    const semanticErrors = workflowSemanticIssues((input as WorkflowCompilation).workflow).map((error) => ({ ...error, path: `/workflow${error.path}` }));
    if (semanticErrors.length > 0) return { ok: false, errors: semanticErrors };
  }
  return { ok: true, value: input as T };
}

function workflowSemanticIssues(workflow: WorkflowSpec): ContractIssue[] {
  const allowedDomains = new Set(workflow.allowedDomains);
  const inputs = new Set(workflow.inputs.map((input) => input.name));
  const issues: ContractIssue[] = [];
  const ids = new Set<string>();
  const stepIndexes = new Map<string, number>();
  workflow.inputs.forEach((input, index) => {
    if (input.secret && input.defaultValue !== undefined) issues.push({ code: "workflow.secret_default", path: `/inputs/${index}/defaultValue`, message: `Input ${index + 1} is secret and cannot store a default value.` });
    if (input.kind === "select" && input.defaultValue !== undefined && !input.options?.includes(input.defaultValue)) issues.push({ code: "workflow.default_not_option", path: `/inputs/${index}/defaultValue`, message: `Input ${index + 1} needs a default value from its option list.` });
  });
  workflow.steps.forEach((step, index) => {
    if (ids.has(step.id)) issues.push({ code: "workflow.step_id_duplicate", path: `/steps/${index}/id`, message: `Step ${index + 1} needs a unique identifier.` });
    ids.add(step.id);
    if (!stepIndexes.has(step.id)) stepIndexes.set(step.id, index);
  });
  workflow.steps.forEach((step, index) => {
    if ("target" in step && !allowedDomains.has(step.target.domain)) issues.push({ code: "workflow.domain_not_allowed", path: `/steps/${index}/target/domain`, message: `Step ${index + 1} uses a domain outside the approved list.` });
    if ((step.action === "type" || step.action === "select" || step.action === "branch") && !inputs.has(step.inputName)) issues.push({ code: "workflow.input_missing", path: `/steps/${index}/inputName`, message: `Step ${index + 1} needs a declared workflow input.` });
    if (step.action === "branch") {
      for (const target of [step.ifTrueStepId, step.ifFalseStepId].filter((value): value is string => value !== undefined)) {
        const targetIndex = stepIndexes.get(target) ?? -1;
        if (targetIndex < 0) issues.push({ code: "workflow.branch_target_missing", path: `/steps/${index}`, message: `Step ${index + 1} points to a branch destination that does not exist.` });
        else if (targetIndex <= index) issues.push({ code: "workflow.branch_target_backward", path: `/steps/${index}`, message: `Step ${index + 1} must branch forward to avoid a workflow cycle.` });
      }
    }
  });
  const assertionIds = new Set<string>();
  const outputNames = new Set(workflow.steps.flatMap((step) => step.action === "read" ? [step.outputName] : []));
  const groups = [...workflow.steps.flatMap((step, index) => (step.assertions ?? []).map((assertion, assertionIndex) => ({ assertion, path: `/steps/${index}/assertions/${assertionIndex}` }))), ...(workflow.successCriteria ?? []).map((assertion, index) => ({ assertion, path: `/successCriteria/${index}` }))];
  for (const { assertion, path } of groups) {
    if (assertionIds.has(assertion.id)) issues.push({ code: "workflow.assertion_id_duplicate", path: `${path}/id`, message: "Every assertion needs a unique identifier." });
    assertionIds.add(assertion.id);
    if ("target" in assertion && !allowedDomains.has(assertion.target.domain)) issues.push({ code: "workflow.assertion_domain_not_allowed", path: `${path}/target/domain`, message: "The assertion target must use an approved workflow domain." });
    if (assertion.kind === "file-downloaded" && assertion.minBytes !== undefined && assertion.maxBytes !== undefined && assertion.minBytes > assertion.maxBytes) issues.push({ code: "workflow.assertion_size_invalid", path, message: "The minimum download size cannot exceed the maximum size." });
    if (assertion.kind === "extracted-value" && !outputNames.has(assertion.outputName)) issues.push({ code: "workflow.assertion_output_missing", path: `${path}/outputName`, message: "The assertion must reference an output produced by a read step." });
  }
  return issues;
}

function mapIssue(error: ErrorObject): ContractIssue {
  const path = error.instancePath || "$";
  const stepMatch = /^\/steps\/(\d+)/.exec(path);
  const subject = stepMatch?.[1] ? `Step ${Number(stepMatch[1]) + 1}` : "This object";
  if (error.keyword === "required") return { code: "contract.required", path, message: `${subject} needs ${String((error.params as { missingProperty?: unknown }).missingProperty ?? "a required field")}.` };
  if (error.keyword === "additionalProperties" || error.keyword === "unevaluatedProperties") return { code: "contract.unknown_field", path, message: `${subject} contains an unsupported field.` };
  return { code: `contract.${error.keyword}`, path, message: `${subject} does not match the ${error.keyword} requirement.` };
}
