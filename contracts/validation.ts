import type { ErrorObject } from "ajv";
import * as generatedValidators from "./protocol.v1.validators";
import {
  mapContractIssue,
  semanticIssuesForContract,
  type ContractIssue,
  type ContractName,
} from "./validation-common";

export type BrowserContractName =
  | "WorkflowSpec"
  | "CaptureSessionSummary"
  | "WorkflowCompilation";
export type { ContractIssue } from "./validation-common";

type ContractValidator = ((input: unknown) => boolean) & {
  errors?: ErrorObject[] | null;
};

const validators = generatedValidators as Partial<Record<
  ContractName,
  ContractValidator
>>;

export function validateContract<T>(
  name: ContractName,
  input: unknown,
): { ok: true; value: T } | { ok: false; errors: ContractIssue[] } {
  const validator = validators[name];
  if (!validator) {
    throw new TypeError(
      `${name} is not available in the browser validator bundle.`,
    );
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
