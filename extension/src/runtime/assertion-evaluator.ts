import type { AssertionResult, LocatorSpec, WorkflowAssertion } from "../../../contracts/protocol";

export interface AssertionElement { text: string; value?: string; rowCount?: number; evidenceRefs?: string[] }
export interface DownloadObservation { fileName: string; contentType?: string; bytes: number; evidenceRefs?: string[] }
export interface AssertionProbe {
  currentUrl(): string;
  element(locator: LocatorSpec): AssertionElement | undefined;
  downloads(): DownloadObservation[];
  confirmation(assertion: Extract<WorkflowAssertion, { kind: "user-confirmation" }>): boolean | undefined;
}

export function evaluateAssertions(assertions: readonly WorkflowAssertion[], probe: AssertionProbe, variables: Readonly<Record<string, string>>, now = new Date()): AssertionResult[] {
  return assertions.map((assertion) => evaluate(assertion, probe, variables, now.toISOString()));
}

function evaluate(assertion: WorkflowAssertion, probe: AssertionProbe, variables: Readonly<Record<string, string>>, verifiedAt: string): AssertionResult {
  if (assertion.kind === "user-confirmation") {
    const confirmed = probe.confirmation(assertion);
    return result(assertion.id, confirmed === true ? "verified" : confirmed === false ? "failed" : "confirmation-required", verifiedAt, confirmed === false ? "assertion.user-rejected" : confirmed === undefined ? "assertion.confirmation-required" : undefined);
  }
  if (assertion.kind === "url-match") return matchResult(assertion.id, probe.currentUrl(), assertion.operator, assertion.expected, verifiedAt, "assertion.url-mismatch");
  if (assertion.kind === "extracted-value") return matchResult(assertion.id, variables[assertion.outputName] ?? "", assertion.operator, assertion.expected, verifiedAt, variables[assertion.outputName] === undefined ? "assertion.output-missing" : "assertion.value-mismatch");
  if (assertion.kind === "file-downloaded") {
    const observed = probe.downloads().find((download) => downloadMatches(download, assertion));
    return observed ? result(assertion.id, "verified", verifiedAt, undefined, `${observed.fileName} · ${observed.bytes} bytes`, observed.evidenceRefs) : result(assertion.id, "failed", verifiedAt, "assertion.download-mismatch");
  }
  const element = probe.element(assertion.target.locator);
  if (assertion.kind === "element-present") return element ? result(assertion.id, "verified", verifiedAt, undefined, element.text, element.evidenceRefs) : result(assertion.id, "failed", verifiedAt, "assertion.element-missing");
  if (assertion.kind === "element-absent") return element ? result(assertion.id, "failed", verifiedAt, "assertion.element-present", element.text, element.evidenceRefs) : result(assertion.id, "verified", verifiedAt);
  if (!element) return result(assertion.id, "failed", verifiedAt, "assertion.element-missing");
  if (assertion.kind === "table-row-count") {
    const count = element.rowCount ?? 0;
    const matches = assertion.operator === "equals" ? count === assertion.count : assertion.operator === "at-least" ? count >= assertion.count : count <= assertion.count;
    return result(assertion.id, matches ? "verified" : "failed", verifiedAt, matches ? undefined : "assertion.row-count-mismatch", String(count), element.evidenceRefs);
  }
  if (assertion.kind === "field-state") return matchResult(assertion.id, element.value ?? "", assertion.operator, assertion.expected, verifiedAt, "assertion.field-state-mismatch", element.evidenceRefs);
  if (assertion.kind === "text-match") return matchResult(assertion.id, element.text, assertion.operator, assertion.expected, verifiedAt, "assertion.text-mismatch", element.evidenceRefs);
  return result(assertion.id, "failed", verifiedAt, "assertion.unsupported");
}

function matchResult(id: string, actual: string, operator: "equals" | "contains" | "matches", expected: string, verifiedAt: string, failure: string, evidenceRefs?: string[]): AssertionResult {
  const matches = compare(actual, operator, expected);
  return result(id, matches ? "verified" : "failed", verifiedAt, matches ? undefined : failure, actual.slice(0, 1000), evidenceRefs);
}
function result(assertionId: string, status: AssertionResult["status"], verifiedAt: string, reasonCode?: string, observed?: string, evidenceRefs?: string[]): AssertionResult { return { schemaVersion: 1, assertionId, status, verifiedAt, ...(reasonCode ? { reasonCode } : {}), ...(observed ? { observed } : {}), ...(evidenceRefs?.length ? { evidenceRefs } : {}) }; }
function compare(actual: string, operator: "equals" | "contains" | "matches", expected: string): boolean { if (operator === "equals") return actual === expected; if (operator === "contains") return actual.includes(expected); try { return new RegExp(expected).test(actual); } catch { return false; } }
function downloadMatches(download: DownloadObservation, assertion: Extract<WorkflowAssertion, { kind: "file-downloaded" }>): boolean { if (download.bytes < (assertion.minBytes ?? 0) || download.bytes > (assertion.maxBytes ?? Number.MAX_SAFE_INTEGER)) return false; if (assertion.contentTypes && (!download.contentType || !assertion.contentTypes.includes(download.contentType))) return false; if (assertion.fileNamePattern) { try { if (!new RegExp(assertion.fileNamePattern).test(download.fileName)) return false; } catch { return false; } } return true; }
