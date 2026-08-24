import { build } from "esbuild";
import path from "node:path";

const release = process.argv.includes("--release");
const apiBaseUrl = process.env.DOONCE_EXTENSION_API_BASE_URL ?? "http://127.0.0.1:4000";
const pilotAllowedOrigin = process.env.DOONCE_EXTENSION_PILOT_ALLOWED_ORIGIN ?? "";
if (release && !apiBaseUrl.startsWith("https://")) throw new Error("Release extension builds require an HTTPS DOONCE_EXTENSION_API_BASE_URL.");
if (release && !pilotAllowedOrigin) throw new Error("Release extension builds require DOONCE_EXTENSION_PILOT_ALLOWED_ORIGIN.");
if (pilotAllowedOrigin) {
  const parsedPilotOrigin = new URL(pilotAllowedOrigin);
  if (parsedPilotOrigin.protocol !== "https:" || parsedPilotOrigin.origin !== pilotAllowedOrigin || parsedPilotOrigin.pathname !== "/" || parsedPilotOrigin.search || parsedPilotOrigin.hash || parsedPilotOrigin.port || parsedPilotOrigin.username || parsedPilotOrigin.password) {
    throw new Error("DOONCE_EXTENSION_PILOT_ALLOWED_ORIGIN must be one exact HTTPS origin.");
  }
}

const extensionValidationPlugin = {
  name: "extension-runtime-validation",
  setup(buildContext) {
    buildContext.onResolve(
      { filter: /^\.\.\/\.\.\/contracts\/validation$/ },
      () => ({ path: path.resolve("contracts/validation-runtime.ts") }),
    );
  },
};

const shared = {
  bundle: true,
  logLevel: "info",
  plugins: [extensionValidationPlugin],
  target: ["chrome120"],
  define: {
    __DOONCE_API_BASE_URL__: JSON.stringify(apiBaseUrl),
    __DOONCE_PILOT_ALLOWED_ORIGIN__: JSON.stringify(pilotAllowedOrigin),
  },
};

await build({
  ...shared,
  entryPoints: {
    "service-worker": "extension/src/service-worker.ts",
    "content-capture": "extension/src/content-capture.ts",
    "demo-runner": "extension/src/demo-runner.ts",
    "content-runner": "extension/src/content-runner.ts",
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
    "runtime/interpreter": "extension/src/runtime/interpreter.ts",
    "runtime/locator-resolution": "extension/src/runtime/locator-resolution.ts",
    "runtime/run-transport": "extension/src/runtime/run-transport.ts",
  },
  format: "cjs",
  outdir: "extension/dist/test",
  outExtension: { ".js": ".cjs" },
  platform: "node",
});
