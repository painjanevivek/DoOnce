import assert from "node:assert/strict";
import test from "node:test";
import { matchesBoundedPattern } from "./bounded-pattern";

test("accepts bounded patterns and rejects expensive or oversized inputs", () => {
  assert.equal(matchesBoundedPattern("^report-[0-9]+$", "report-42"), true);
  assert.equal(matchesBoundedPattern("(a+)+$", "a".repeat(1000)), false);
  assert.equal(matchesBoundedPattern("a".repeat(257), "a"), false);
  assert.equal(matchesBoundedPattern("a", "a".repeat(10_001)), false);
});
