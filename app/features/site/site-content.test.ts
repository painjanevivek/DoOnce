import assert from "node:assert/strict";
import test from "node:test";
import { authoringPaths, exampleScenarios, taskExamples } from "./site-content";

test("publishes three distinct authoring paths without fabricated proof", () => {
  assert.deepEqual(
    authoringPaths.map((item) => item.id),
    ["record", "describe", "video"],
  );
  assert.equal(new Set(authoringPaths.map((item) => item.title)).size, 3);
  assert.ok(exampleScenarios.every((item) => item.kind === "example"));
  assert.ok(taskExamples.length >= 5);
});

test("avoids banned generic labels and customer claims", () => {
  const copy = JSON.stringify({ authoringPaths, exampleScenarios, taskExamples });

  assert.doesNotMatch(
    copy,
    /SECTION \d|QUESTION \d|trusted by|customer says/i,
  );
});
