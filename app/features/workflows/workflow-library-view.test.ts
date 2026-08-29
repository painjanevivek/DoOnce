import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkflowLibraryView } from "./workflow-library-view";

test("presents the current workflow as a card and keeps evidence disclosed", () => {
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
      extensionConnection: null,
      extensionConnectionState: "unavailable",
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
  assert.match(html, /Next safe action/);
  assert.match(html, /Latest action/);
  assert.match(html, /Draft is ready for review/);
  assert.match(html, /workflow-card-list/);
  assert.match(html, /Workflow evidence/);
  assert.match(html, />Show it in Chrome</);
  assert.match(html, />Describe the task</);
  assert.match(html, />Upload a video</);
  assert.match(html, /<details class="library-disclosure"/);
  assert.doesNotMatch(html, /<details[^>]* open/);
});

test("uses only confirmed pilot boundary and connection data in MVP mode", () => {
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
      extensionConnection: { connected: false },
      extensionConnectionState: "confirmed",
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

  assert.match(html, /Approved origin/);
  assert.match(html, /Pilot proof path/);
  assert.match(html, /https:\/\/reports\.example\.com/);
  assert.match(html, /No connected extension is confirmed/);
  assert.match(html, /Connect Chrome before recording/);
  assert.match(html, />Show it in Chrome</);
  assert.doesNotMatch(html, /Describe the task|Upload a video|Forbidden description panel|Forbidden video panel/);
});

test("does not claim a verified file or receipt from workflow summary data", () => {
  const html = renderToStaticMarkup(
    createElement(WorkflowLibraryView, {
      activeMode: "record",
      availableModes: ["record"],
      authoringPanels: {
        record: createElement("div", null, "Recorder panel"),
        describe: null,
        video: null,
      },
      message: "",
      mvpMode: true,
      pilotOrigin: "https://reports.example.com",
      extensionConnection: { connected: true, extensionVersion: "1.2.3" },
      extensionConnectionState: "confirmed",
      onModeChange() {},
      onOpenWorkflow() {},
      onRefresh() {},
      onRun() {},
      operations: null,
      runDialog: null,
      state: "ready",
      workflows: [
        {
          id: "10000000-0000-4000-8000-000000000002",
          title: "Weekly operations report",
          activeVersion: 1,
          draftVersion: null,
          status: "active",
          updatedAt: "2026-08-10T10:00:00.000Z",
          lastRunAt: "2026-08-10T09:00:00.000Z",
          successRate: 100,
        },
      ],
    }),
  );

  assert.match(html, /Server confirmed the connected extension v1\.2\.3/);
  assert.match(html, /Approve one run/);
  assert.match(html, /Workflow summaries do not prove a download/);
  assert.doesNotMatch(html, /Verified file available|Receipt verified/);
});
