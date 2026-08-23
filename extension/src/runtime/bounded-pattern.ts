export function matchesBoundedPattern(pattern: string, value: string): boolean {
  if (pattern.length === 0 || pattern.length > 256 || value.length > 10_000) return false;
  if (/\\[1-9]|\(\?<[=!]|\((?:[^()\\]|\\.)*[+*{](?:[^()\\]|\\.)*\)[+*{]|(?:\+|\*|\{\d+(?:,\d*)?\}){2}/u.test(pattern)) return false;
  try { return new RegExp(pattern, "u").test(value); } catch { return false; }
}
