import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkflowLibraryView } from "./workflow-library-view";

test("prioritizes workflow status and progressively discloses operations", () => {
  const html = renderToStaticMarkup(
    createElement(WorkflowLibraryView, {
      activeMode: "record",
      availableModes: ["record", "describe", "video"],
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
      mvpMode: false,
      pilotOrigin: null,
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

test("removes excluded authoring paths from the MVP render tree", () => {
  const html = renderToStaticMarkup(
    createElement(WorkflowLibraryView, {
      activeMode: "record",
      availableModes: ["record"],
      authoringPanels: {
        record: createElement("div", null, "Recorder panel"),
        describe: createElement("div", null, "Forbidden description panel"),
        video: createElement("div", null, "Forbidden video panel"),
      },
      message: "",
      mvpMode: true,
      pilotOrigin: "https://reports.example.com",
      onModeChange() {},
      onOpenWorkflow() {},
      onRefresh() {},
      onRun() {},
      operations: null,
      runDialog: null,
      state: "ready",
      workflows: [],
    }),
  );

  assert.match(html, /Approved pilot boundary/);
  assert.match(html, /https:\/\/reports\.example\.com/);
  assert.match(html, />Show it in Chrome</);
  assert.doesNotMatch(html, /Describe the task|Upload a video|Forbidden description panel|Forbidden video panel/);
});
