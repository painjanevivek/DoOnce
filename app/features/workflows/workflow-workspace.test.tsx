import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkflowWorkspace } from "./workflow-workspace";

test("keeps every editor mounted inside a three-region workspace", () => {
  const html = renderToStaticMarkup(
    <WorkflowWorkspace
      activeView="steps"
      inspector={<p>Ready after a passing test</p>}
      issueViews={new Set(["inputs"])}
      onViewChange={() => undefined}
      panels={{
        overview: <p>Overview editor</p>,
        steps: <p>Step editor</p>,
        inputs: <p>Input editor</p>,
        test: <p>Test runner</p>,
        history: <p>Version history</p>,
        json: <p>Developer JSON</p>,
      }}
    />,
  );

  assert.match(html, /aria-label="Workflow outline"/);
  assert.match(html, /data-workspace-region="canvas"/);
  assert.match(html, /data-workspace-region="inspector"/);
  assert.match(html, /aria-current="page"[^>]*><strong>Steps/);
  assert.match(html, /data-view="overview" hidden=""/);
  assert.match(html, /Overview editor/);
  assert.match(html, /Developer JSON/);
  assert.match(html, /Ready after a passing test/);
  assert.match(html, /Inputs<span class="workspace-issue"/);
});
