import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkflowLibraryView } from "./workflow-library-view";

test("prioritizes workflow status and progressively discloses operations", () => {
  const html = renderToStaticMarkup(
    createElement(WorkflowLibraryView, {
      activeMode: "record",
      authoringPanels: {
        record: createElement("div", null, "Recorder panel"),
        describe: createElement("div", null, "Description panel"),
        video: createElement("div", null, "Video panel"),
      },
      message: "Draft is ready for review.",
      onModeChange() {},
      onOpenWorkflow() {},
      onRefresh() {},
      onRun() {},
      operations: createElement("div", null, "Audit scheduling beta support"),
      runDialog: null,
      state: "ready",
      workflows: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          title: "Download weekly supplier invoices",
          activeVersion: 3,
          draftVersion: 4,
          status: "active",
          updatedAt: "2026-08-10T10:00:00.000Z",
          lastRunAt: "2026-08-10T09:00:00.000Z",
          successRate: 98,
        },
      ],
    }),
  );

  assert.match(html, /Download weekly supplier invoices/);
  assert.match(html, /data-status="active"/);
  assert.match(html, /Latest action/);
  assert.match(html, /Draft is ready for review/);
  assert.match(html, />Show it in Chrome</);
  assert.match(html, />Describe the task</);
  assert.match(html, />Upload a video</);
  assert.match(html, /<details class="library-disclosure"/);
  assert.doesNotMatch(html, /<details[^>]* open/);
});
