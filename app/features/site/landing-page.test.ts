import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LandingPage } from "./landing-page";

test("renders the complete install-first Guided Proof journey", () => {
  const html = renderToStaticMarkup(createElement(LandingPage));

  assert.match(html, /Teach the browser once/);
  assert.match(html, /href="\/install"/);
  assert.match(html, /class="guided-proof-bento"/);
  assert.match(html, /proof-card--record/);
  assert.match(html, /proof-card--compile/);
  assert.match(html, /proof-card--verify/);
  assert.match(html, /class="authoring-accordion"/);
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /Example scenario/);
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /id="examples"/);
});

test("does not present invented customers or generic template labels", () => {
  const html = renderToStaticMarkup(createElement(LandingPage));

  assert.doesNotMatch(
    html,
    /SECTION \d|QUESTION \d|trusted by|customer says|five-star/i,
  );
  assert.doesNotMatch(html, /<blockquote/);
});
