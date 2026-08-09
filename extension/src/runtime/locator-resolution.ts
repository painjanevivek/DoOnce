import type { LocatorCandidate, LocatorSpec } from "../../../contracts/protocol";

export interface LocatorMatch<T> { candidate: LocatorCandidate; elements: T[] }
export type LocatorResolution<T> =
  | { status: "resolved"; element: T; candidate: LocatorCandidate; confidence: number }
  | { status: "missing" }
  | { status: "ambiguous"; candidate: LocatorCandidate; count: number };

export function resolveLocator<T>(locator: LocatorSpec, find: (candidate: LocatorCandidate) => T[]): LocatorResolution<T> {
  for (const candidate of [locator.primary, ...locator.fallbacks]) {
    const elements = unique(find(candidate));
    if (elements.length === 1) return { status: "resolved", element: elements[0]!, candidate, confidence: candidate.confidence };
    if (elements.length > 1) return { status: "ambiguous", candidate, count: elements.length };
  }
  return { status: "missing" };
}

function unique<T>(values: T[]): T[] { return [...new Set(values)]; }
