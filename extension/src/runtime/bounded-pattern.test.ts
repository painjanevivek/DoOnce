import assert from "node:assert/strict";
import test from "node:test";
import { matchesBoundedPattern } from "./bounded-pattern";

test("evaluates bounded workflow patterns without backtracking", () => {
  assert.equal(matchesBoundedPattern("^report-[0-9]+$", "report-42"), true);
  assert.equal(matchesBoundedPattern("^(report|invoice)-[0-9]+$", "invoice-42"), true);

  const startedAt = performance.now();
  assert.equal(matchesBoundedPattern("^(a|aa)+$", `${"a".repeat(40)}b`), false);
  assert.ok(performance.now() - startedAt < 250, "overlapping alternation must remain time-bounded");

  assert.equal(matchesBoundedPattern("^([a-z]+)*$", `${"a".repeat(10_000)}!`), false);
  assert.equal(matchesBoundedPattern("(report)-\\1", "reportreport"), false);
  assert.equal(matchesBoundedPattern("report(?=-[0-9]+)", "report-42"), false);
  assert.equal(matchesBoundedPattern("a".repeat(257), "a"), false);
  assert.equal(matchesBoundedPattern("a", "a".repeat(10_001)), false);
});
