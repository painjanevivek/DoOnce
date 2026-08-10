import { Ajv2020, type ValidateFunction } from "ajv/dist/2020";
import addFormatsModule from "ajv-formats";
import protocolSchema from "./protocol.v1.schema.json";
import {
  mapContractIssue,
  semanticIssuesForContract,
  type ContractIssue,
  type ContractName,
} from "./validation-common";

export type { ContractIssue, ContractName } from "./validation-common";

const schemaId = "https://doonce.dev/schemas/protocol.v1.schema.json";
const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
const addFormats = addFormatsModule as unknown as (instance: Ajv2020) => Ajv2020;
addFormats(ajv);
ajv.addSchema(protocolSchema, schemaId);
const validators = new Map<ContractName, ValidateFunction>();

export function validateContract<T>(
  name: ContractName,
  input: unknown,
): { ok: true; value: T } | { ok: false; errors: ContractIssue[] } {
  let validator = validators.get(name);
  if (!validator) {
    validator = ajv.compile({ $ref: `${schemaId}#/$defs/${name}` });
    validators.set(name, validator);
  }
  if (!validator(input)) {
    return {
      ok: false,
      errors: (validator.errors ?? []).map(mapContractIssue),
    };
  }

  const semanticErrors = semanticIssuesForContract(name, input);
  return semanticErrors.length > 0
    ? { ok: false, errors: semanticErrors }
    : { ok: true, value: input as T };
}
