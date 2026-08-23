import type { RecordedActionSummary } from "./capture-export";
import type { LocatorCandidate, WorkflowSpec, WorkflowStep } from "../../contracts/protocol";
import { validateContract } from "../../contracts/validation-runtime";

export const workflowSpecFormat = "doonce.workflow-spec.v1" as const;
export const workflowSpecSchemaVersion = 1 as const;
const locatorPattern = /^(?:#[a-zA-Z][a-zA-Z0-9_-]{0,63}|\[data-doonce-capture-id="[a-z0-9-]{1,64}"\])$/i;

interface CompileOptions {
  title?: string;
  idFactory?: () => string;
}

export type CompileResult =
  | { ok: true; value: WorkflowSpec }
  | { ok: false; errors: string[] };

export function compileRecordedActions(actions: unknown, options: CompileOptions = {}): CompileResult {
  if (!Array.isArray(actions) || actions.length === 0 || actions.length > 100) return { ok: false, errors: ["A capture must contain between 1 and 100 recorded events."] };
  const title = options.title ?? "Recorded browser workflow";
  const idFactory = options.idFactory ?? (() => crypto.randomUUID());
  if (title.trim().length === 0 || title.length > 120) return { ok: false, errors: ["Workflow title must be between 1 and 120 characters."] };

  const origin = parseOrigin((actions[0] as Partial<RecordedActionSummary> | undefined)?.origin);
  if (!origin) return { ok: false, errors: ["Capture origin is not supported."] };
  const steps: WorkflowStep[] = [];
  for (const [index, action] of actions.entries()) {
    if (!isCompilableAction(action, origin)) return { ok: false, errors: [`Capture event ${index + 1} cannot be compiled.`] };
    const download = action.actionHint === "download";
    steps.push(download ? {
      id: idFactory(), action: "download", name: "Download the verified report", expectedOutcome: "The expected report download is confirmed.",
      target: { domain: origin.hostname, path: action.path, locator: { schemaVersion: 1, primary: locatorCandidate(action.selector), fallbacks: [] } },
    } : {
      id: idFactory(), action: "ask-approval", name: `Review recorded ${action.eventKind}`, expectedOutcome: "An operator reviews this recorded action before it can run.",
      prompt: `Review the recorded ${action.eventKind} action.`,
    });
  }
  const workflow = { schemaVersion: workflowSpecSchemaVersion, format: workflowSpecFormat, title: title.trim(), allowedDomains: [origin.hostname], inputs: [], steps } satisfies WorkflowSpec;
  const validation = validateContract<WorkflowSpec>("WorkflowSpec", workflow);
  return validation.ok ? validation : { ok: false, errors: validation.errors.map((error) => error.message) };
}

function locatorCandidate(selector: string): LocatorCandidate {
  const id = /^#([a-zA-Z][a-zA-Z0-9_-]{0,63})$/.exec(selector)?.[1];
  if (id) return { strategy: "id", value: id, confidence: 0.95 };
  const captureId = /^\[data-doonce-capture-id="([a-z0-9-]{1,64})"\]$/i.exec(selector)?.[1];
  if (!captureId) throw new TypeError("The recorded locator cannot be compiled.");
  return { strategy: "capture-id", value: captureId, confidence: 1 };
}

function parseOrigin(value: unknown): URL | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const origin = new URL(value);
    return origin.origin === value && (origin.protocol === "https:" || (origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname))) ? origin : undefined;
  } catch {
    return undefined;
  }
}

function isCompilableAction(value: unknown, origin: URL): value is RecordedActionSummary {
  if (typeof value !== "object" || value === null) return false;
  const action = value as Record<string, unknown>;
  return action.origin === origin.origin
    && typeof action.path === "string" && action.path.startsWith("/") && !action.path.startsWith("//") && !action.path.includes("..")
    && typeof action.selector === "string" && locatorPattern.test(action.selector)
    && (action.eventKind === "click" || action.eventKind === "change" || action.eventKind === "input")
    && (action.actionHint === undefined || action.actionHint === "download");
}
