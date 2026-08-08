import { build } from "esbuild";

const shared = {
  bundle: true,
  logLevel: "info",
  target: ["chrome120"],
};

await build({
  ...shared,
  entryPoints: {
    "service-worker": "extension/src/service-worker.ts",
    "content-capture": "extension/src/content-capture.ts",
    "demo-runner": "extension/src/demo-runner.ts",
    popup: "extension/src/popup.ts",
  },
  format: "iife",
  outdir: "extension/dist",
  platform: "browser",
  sourcemap: true,
});

await build({
  ...shared,
  entryPoints: {
    "capture-eligibility": "extension/src/capture-eligibility.ts",
    "capture-export": "extension/src/capture-export.ts",
    "recording-state": "extension/src/recording-state.ts",
    "run-eligibility": "extension/src/run-eligibility.ts",
    "run-notification": "extension/src/run-notification.ts",
    "receipt-view": "extension/src/receipt-view.ts",
    "workflow-compiler": "extension/src/workflow-compiler.ts",
  },
  format: "cjs",
  outdir: "extension/dist/test",
  outExtension: { ".js": ".cjs" },
  platform: "node",
});
