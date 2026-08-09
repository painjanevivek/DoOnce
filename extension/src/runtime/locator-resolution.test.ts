import assert from "node:assert/strict";
import test from "node:test";
import { resolveLocator } from "./locator-resolution";

const locator = { schemaVersion: 1 as const, primary: { strategy: "role" as const, value: "button", confidence: 0.9 }, fallbacks: [{ strategy: "text" as const, value: "Download", confidence: 0.7 }] };

test("uses locators in declared semantic order", () => {
  const result = resolveLocator(locator, (candidate) => candidate.strategy === "text" ? ["download"] : []);
  assert.deepEqual(result, { status: "resolved", element: "download", candidate: locator.fallbacks[0], confidence: 0.7 });
});

test("stops on ambiguity instead of guessing", () => {
  const result = resolveLocator(locator, (candidate) => candidate.strategy === "role" ? ["one", "two"] : ["fallback"]);
  assert.deepEqual(result, { status: "ambiguous", candidate: locator.primary, count: 2 });
});

test("reports a stable missing outcome", () => { assert.deepEqual(resolveLocator(locator, () => []), { status: "missing" }); });
