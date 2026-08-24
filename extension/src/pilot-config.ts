import type { WorkflowSpec } from "../../contracts/protocol";

declare const __DOONCE_PILOT_ALLOWED_ORIGIN__: string;

export function normalizePilotAllowedOrigin(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" || parsed.origin !== value || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.port) {
    throw new TypeError("The extension pilot boundary must be one exact HTTPS origin.");
  }
  return parsed.origin;
}

const configuredPilotOrigin = typeof __DOONCE_PILOT_ALLOWED_ORIGIN__ === "string" ? __DOONCE_PILOT_ALLOWED_ORIGIN__ : "";

export const pilotAllowedOrigin = normalizePilotAllowedOrigin(configuredPilotOrigin);

export function isPilotOrigin(origin: string): boolean {
  return pilotAllowedOrigin === undefined || origin === pilotAllowedOrigin;
}

export function isPilotWorkflowSpec(spec: WorkflowSpec): boolean {
  if (!pilotAllowedOrigin) return true;
  const domain = new URL(pilotAllowedOrigin).hostname;
  const allowedActions = new Set(["navigate", "wait", "read", "compare", "branch", "download", "stop"]);
  return spec.allowedDomains.length === 1
    && spec.allowedDomains[0] === domain
    && spec.steps.every((step) => allowedActions.has(step.action) && (!("target" in step) || step.target.domain === domain))
    && spec.steps.filter((step) => step.action === "download").length === 1
    && (Boolean(spec.successCriteria?.length) || spec.steps.some((step) => Boolean(step.assertions?.length) || step.action === "compare"));
}
