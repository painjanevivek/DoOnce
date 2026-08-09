/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

// Replays the shipped service-worker and content-runner scripts with the smallest
// Chrome API/DOM surface needed for the local demo fixture. It is deliberately
// separate from production code and records no page content or identifiers.
const assert = require("node:assert/strict");
const { createHash, randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const extensionDirectory = __dirname;
const builtDirectory = path.join(extensionDirectory, "dist");
const reportDirectory = path.join(extensionDirectory, "..", "docs", "reliability");
const workflowVersion = 1;
const fixtureOrigin = "http://127.0.0.1:3000";
const fixtureUrl = `${fixtureOrigin}/demo/reports`;
const sourceFiles = ["src/service-worker.ts", "src/demo-runner.ts", "src/run-eligibility.ts", "controlled-run-harness.js"];
const scenarios = [
  ...Array(30).fill("completed"),
  ...Array(10).fill("changed-page"),
  ...Array(5).fill("slow-network"),
  ...Array(5).fill("unknown"),
];

function readExtensionScript(filename) {
  return fs.readFileSync(path.join(builtDirectory, filename), "utf8");
}

function sourceDigests() {
  return Object.fromEntries(sourceFiles.map((filename) => [`extension/${filename}`, createHash("sha256").update(fs.readFileSync(path.join(extensionDirectory, filename), "utf8")).digest("hex")]));
}

function createStorage() {
  const values = { "doonce.consentedOrigins": [fixtureOrigin], "doonce.demoRunReceipts": [] };
  const receiptEvents = [];
  let runMetadata;

  return {
    receiptEvents,
    setRunMetadata(metadata) {
      runMetadata = metadata;
    },
    local: {
      async get(keys) {
        const requested = Array.isArray(keys) ? keys : [keys];
        return Object.fromEntries(requested.map((key) => [key, values[key]]));
      },
      async set(nextValues) {
        if (Array.isArray(nextValues["doonce.demoRunReceipts"])) {
          const receipt = nextValues["doonce.demoRunReceipts"].at(-1);
          if (receipt && runMetadata) receiptEvents.push({ ...runMetadata, ...receipt });
        }
        Object.assign(values, nextValues);
      },
    },
  };
}

function createDemoDocument(scenario) {
  class FakeButton {
    disabled = false;

    click() {
      if (scenario === "completed") status.textContent = "Download started";
    }
  }

  const status = { textContent: "Ready for a verified local download." };
  const button = new FakeButton();
  const fixture = {
    querySelector(selector) {
      if (selector === '[data-doonce-safe-action="download"]') return button;
      if (selector === "#demo-run-status") return status;
      return null;
    },
  };

  return {
    document: {
      querySelector(selector) {
        return scenario === "changed-page" || selector !== '[data-doonce-demo-report="weekly-sales"]' ? null : fixture;
      },
    },
    FakeButton,
  };
}

function sendMessageToListener(listener, message) {
  return new Promise((resolve, reject) => {
    let responded = false;
    const timeout = setTimeout(() => reject(new Error("Extension message did not respond.")), 1500);
    const sendResponse = (response) => {
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
        resolve(response);
      }
    };
    try {
      const asyncResponse = listener(message, {}, sendResponse);
      if (asyncResponse !== true && !responded) {
        clearTimeout(timeout);
        resolve(undefined);
      }
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

function createWorkerRun(storage, scenario) {
  const workerListeners = [];
  const contentListeners = [];
  let contentLoaded = false;

  const runContentScript = () => {
    if (contentLoaded) return;
    contentLoaded = true;
    const { document, FakeButton } = createDemoDocument(scenario);
    vm.runInNewContext(readExtensionScript("demo-runner.js"), {
      chrome: { runtime: { onMessage: { addListener: (listener) => contentListeners.push(listener) } } },
      document,
      HTMLButtonElement: FakeButton,
      Promise,
      setTimeout,
    }, { filename: "demo-runner.js" });
  };

  const chrome = {
    runtime: {
      onInstalled: { addListener() {} },
      onStartup: { addListener() {} },
      onMessage: { addListener: (listener) => workerListeners.push(listener) },
      getURL: (filename) => `chrome-extension://controlled/${filename}`,
      getManifest: () => ({ version: "0.3.0" }),
    },
    alarms: { create: async () => undefined, onAlarm: { addListener() {} } },
    downloads: { onCreated: { addListener() {} }, onChanged: { addListener() {} } },
    storage: { local: storage.local },
    notifications: { create: async () => undefined },
    tabs: {
      onCreated: { addListener() {} },
      onActivated: { addListener() {} },
      get: async () => ({ id: 1, url: fixtureUrl }),
      sendMessage: async (_tabId, message) => {
        if (scenario === "unknown") throw new Error("Injected message channel failure");
        const listener = contentListeners.at(-1);
        if (!listener) throw new Error("Demo runner has not been injected");
        return sendMessageToListener(listener, message);
      },
    },
    scripting: { executeScript: async () => runContentScript() },
  };

  const context = {
    chrome,
    crypto: { randomUUID },
    URL,
    importScripts: (...filenames) => filenames.forEach((filename) => vm.runInNewContext(readExtensionScript(filename), context, { filename })),
  };
  vm.runInNewContext(readExtensionScript("service-worker.js"), context, { filename: "service-worker.js" });
  assert.ok(workerListeners.length > 0, "The service worker must register message listeners.");
  return async () => {
    for (const listener of [...workerListeners].reverse()) {
      const result = await sendMessageToListener(listener, { type: "doonce.run-demo-download", tabId: 1, origin: fixtureOrigin });
      if (result !== undefined) return result;
    }
    throw new Error("The service worker did not handle the local demo run message.");
  };
}

async function runControlledBatch() {
  const { canStartDemoRun } = require("./dist/test/run-eligibility.cjs");
  const storage = createStorage();
  const startedAt = new Date().toISOString();

  for (const [index, scenario] of scenarios.entries()) {
    assert.equal(canStartDemoRun(fixtureUrl, [fixtureOrigin], true), true, "Every run must require an explicit approval on the permitted local fixture.");
    const runStartedAt = new Date().toISOString();
    storage.setRunMetadata({ run: index + 1, scenario, startedAt: runStartedAt, workflowVersion });
    const result = await createWorkerRun(storage, scenario)();
    assert.equal(result.outcome, scenario === "completed" ? "completed" : "paused");
  }

  const finishedAt = new Date().toISOString();
  const runs = storage.receiptEvents.map((receipt) => {
    const run = { ...receipt };
    delete run.id;
    delete run.origin;
    delete run.stepOutcomes;
    return run;
  });
  const completed = runs.filter((run) => run.outcome === "completed").length;
  const paused = runs.filter((run) => run.outcome === "paused").length;
  const pauseReasons = Object.fromEntries(["changed-page", "slow-network", "unknown"].map((reason) => [reason, runs.filter((run) => run.pauseReason === reason).length]));

  assert.equal(runs.length, 50, "All 50 receipts must be captured before the extension storage cap applies.");
  assert.equal(completed, 30);
  assert.equal(paused, 20);
  assert.deepEqual(pauseReasons, { "changed-page": 10, "slow-network": 5, unknown: 5 });

  return {
    reportVersion: 2,
    generatedAt: finishedAt,
    execution: {
      mode: "automated-controlled-local-extension-harness",
      manual: false,
      fixture: "local demo reports page",
      explicitApprovalRequired: true,
      scriptsExercised: ["extension/src/service-worker.ts", "extension/src/demo-runner.ts", "extension/src/run-eligibility.ts"],
      note: "The service worker intentionally retains only the latest 20 browser-storage receipts; this harness captures each receipt at its storage write without recording its ID, origin, step metadata, or page data.",
    },
    provenance: {
      sourceDigests: sourceDigests(),
      assurance: "CI replays this exact source path and rejects this report if any tracked source digest changes.",
    },
    workflow: { version: workflowVersion, label: "local demo fixture" },
    startedAt,
    finishedAt,
    runCount: runs.length,
    results: { completed, paused, pauseReasons },
    runs,
  };
}

function toMarkdown(report) {
  const rows = report.runs.map((run) => `| ${run.run} | ${run.workflowVersion} | ${run.outcome} | ${run.pauseReason ?? "—"} | ${run.startedAt} | ${run.finishedAt} |`).join("\n");
  const evidence = Object.entries(report.provenance.sourceDigests).map(([filename, digest]) => `| ${filename} | \`${digest}\` |`).join("\n");
  return `# Controlled local extension run report\n\nGenerated: ${report.generatedAt}\n\nThis is automated, controlled local evidence—not 50 manual user runs or a production/pilot reliability result. It exercises the shipped extension service worker, run policy, and demo runner with explicit approval required for every run.\n\n| Metric | Result |\n| --- | ---: |\n| Run count | ${report.runCount} |\n| Completed | ${report.results.completed} |\n| Paused | ${report.results.paused} |\n| Workflow version | ${report.workflow.version} |\n\n## Pause reasons\n\n| Reason | Count |\n| --- | ---: |\n| Changed page | ${report.results.pauseReasons["changed-page"]} |\n| Slow network | ${report.results.pauseReasons["slow-network"]} |\n| Unknown / message-channel failure | ${report.results.pauseReasons.unknown} |\n\nThe workflow version is the controlled local fixture configuration. Extension receipts deliberately omit workflow identifiers, origins, element selectors, values, and receipt IDs.\n\n## Evidence binding\n\nCI replays the service worker, run policy, and content runner for the same 50-run matrix. It also rejects this ledger if any source digest below changes. This proves the controlled code path and binds the ledger to that exact source; it does not claim to prove a production or pilot run.\n\n| Source | SHA-256 |\n| --- | --- |\n${evidence}\n\n## Run ledger\n\n| Run | Workflow version | Result | Pause reason | Started (UTC) | Finished (UTC) |\n| ---: | ---: | --- | --- | --- | --- |\n${rows}\n`;
}

async function main() {
  const report = await runControlledBatch();
  fs.mkdirSync(reportDirectory, { recursive: true });
  fs.writeFileSync(path.join(reportDirectory, "controlled-local-extension-runs.json"), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(reportDirectory, "controlled-local-extension-runs.md"), toMarkdown(report));
  process.stdout.write(`${JSON.stringify({ runCount: report.runCount, ...report.results, reportDirectory }, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
}

module.exports = { runControlledBatch, toMarkdown };
