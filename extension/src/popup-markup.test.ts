import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const markup = readFileSync(new URL("../popup.html", import.meta.url), "utf8");

test("popup accessibility references resolve to unique elements", () => {
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "popup IDs must be unique");

  const knownIds = new Set(ids);
  for (const match of markup.matchAll(/\saria-(?:labelledby|describedby)="([^"]+)"/g)) {
    const references = match[1];
    if (!references) continue;
    for (const reference of references.split(/\s+/)) {
      assert.ok(knownIds.has(reference), `ARIA reference #${reference} must exist`);
    }
  }
});

test("popup keeps validation, status, and destructive confirmation accessible", () => {
  assert.match(markup, /id="pairing-code"[^>]*aria-describedby="pairing-help status"[^>]*aria-invalid="false"/);
  assert.match(markup, /id="status"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
  assert.match(markup, /<dialog[^>]*id="destructive-confirmation"[^>]*aria-labelledby="confirmation-title"[^>]*aria-describedby="confirmation-message"/);
  assert.doesNotMatch(markup, /<button(?![^>]*\stype="button")[^>]*>/);
});
