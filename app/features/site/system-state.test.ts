import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AccountForm from "../../components/account-form";
import { SystemState } from "./system-state";

test("renders a clear recovery state without marketing motion hooks", () => {
  const html = renderToStaticMarkup(
    createElement(SystemState, {
      eyebrow: "Page not found",
      title: "There is nothing to run here.",
      message: "No workflow was changed. Return to the workflow library.",
      action: createElement("a", { href: "/workflows" }, "Open workflows"),
      role: "alert",
    }),
  );

  assert.match(html, /<h1[^>]*>There is nothing to run here/);
  assert.match(html, /No workflow was changed/);
  assert.match(html, /href="\/workflows"/);
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /data-proof-media|data-reveal-word/);
});

test("associates account feedback with labelled credential fields", () => {
  const html = renderToStaticMarkup(createElement(AccountForm));

  assert.match(html, /<label for="tenantName">Workspace name<\/label>/);
  assert.match(html, /<label for="email">Work email<\/label>/);
  assert.match(html, /<label for="password">Password<\/label>/);
  assert.match(html, /autocomplete="organization"/i);
  assert.match(html, /autocomplete="email"/i);
  assert.match(html, /autocomplete="new-password"/i);
  assert.match(html, /id="account-feedback"/);
  assert.equal(html.match(/aria-describedby="account-feedback"/g)?.length, 3);
  assert.match(html, /Create secure workspace/);
});
