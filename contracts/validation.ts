import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020";
import addFormatsModule from "ajv-formats";
import protocolSchema from "./protocol.v1.schema.json";
import type { WorkflowSpec } from "./protocol";

export type ContractName = "WorkflowSpec" | "LocatorSpec" | "WorkflowInputDefinition" | "RuntimeCapabilities" | "CaptureSession" | "RecordedAction" | "CaptureHandshake" | "CaptureSyncRequest" | "CaptureSyncAck" | "RunRequest" | "StepResult" | "RunResult" | "RepairProposal" | "ExtensionMessage" | "ApiError";
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
  return { ok: true, value: input as T };
}

function workflowSemanticIssues(workflow: WorkflowSpec): ContractIssue[] {
  const allowedDomains = new Set(workflow.allowedDomains);
  const inputs = new Set(workflow.inputs.map((input) => input.name));
  const ids = new Set<string>();
  const issues: ContractIssue[] = [];
  workflow.steps.forEach((step, index) => {
    if (ids.has(step.id)) issues.push({ code: "workflow.step_id_duplicate", path: `/steps/${index}/id`, message: `Step ${index + 1} needs a unique identifier.` });
    ids.add(step.id);
    if ("target" in step && !allowedDomains.has(step.target.domain)) issues.push({ code: "workflow.domain_not_allowed", path: `/steps/${index}/target/domain`, message: `Step ${index + 1} uses a domain outside the approved list.` });
    if ((step.action === "type" || step.action === "select") && !inputs.has(step.inputName)) issues.push({ code: "workflow.input_missing", path: `/steps/${index}/inputName`, message: `Step ${index + 1} needs a declared workflow input.` });
  });
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
