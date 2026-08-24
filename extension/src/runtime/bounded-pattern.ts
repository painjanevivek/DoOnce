import { RE2JS } from "re2js";

export function matchesBoundedPattern(pattern: string, value: string): boolean {
  if (pattern.length === 0 || pattern.length > 256 || value.length > 10_000) return false;
  try { return RE2JS.compile(pattern).test(value); } catch { return false; }
}
