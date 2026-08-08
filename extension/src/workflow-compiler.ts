import type { RecordedActionSummary } from "./capture-export";

export const workflowSpecFormat = "doonce.workflow-spec.v1" as const;
const locatorPattern = /^(?:#[a-zA-Z][a-zA-Z0-9_-]{0,63}|\[data-doonce-capture-id="[a-z0-9-]{1,64}"\])$/i;

interface CompileOptions {
  title?: string;
  idFactory?: () => string;
}

interface CompiledStep {
  id: string;
  action: "download" | "ask-approval";
  name: string;
  expectedOutcome: string;
  target: { domain: string; path: string; selector: string };
}

export type CompileResult =
  | { ok: true; value: { format: typeof workflowSpecFormat; title: string; allowedDomains: string[]; inputs: []; steps: CompiledStep[] } }
  | { ok: false; errors: string[] };

export function compileRecordedActions(actions: unknown, options: CompileOptions = {}): CompileResult {
  if (!Array.isArray(actions) || actions.length === 0 || actions.length > 100) return { ok: false, errors: ["A capture must contain between 1 and 100 recorded events."] };
  const title = options.title ?? "Recorded browser workflow";
  const idFactory = options.idFactory ?? (() => crypto.randomUUID());
  if (title.trim().length === 0 || title.length > 120) return { ok: false, errors: ["Workflow title must be between 1 and 120 characters."] };

  const origin = parseOrigin((actions[0] as Partial<RecordedActionSummary> | undefined)?.origin);
  if (!origin) return { ok: false, errors: ["Capture origin is not supported."] };
  const steps: CompiledStep[] = [];
  for (const [index, action] of actions.entries()) {
    if (!isCompilableAction(action, origin)) return { ok: false, errors: [`Capture event ${index + 1} cannot be compiled.`] };
    const download = action.actionHint === "download";
    steps.push({
      id: idFactory(),
      action: download ? "download" : "ask-approval",
      name: download ? "Download the verified report" : `Review recorded ${action.eventKind}`,
      expectedOutcome: download ? "The expected report download is confirmed." : "An operator reviews this recorded action before it can run.",
      target: { domain: origin.hostname, path: action.path, selector: action.selector },
    });
  }
  return { ok: true, value: { format: workflowSpecFormat, title: title.trim(), allowedDomains: [origin.hostname], inputs: [], steps } };
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
