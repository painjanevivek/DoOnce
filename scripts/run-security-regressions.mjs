import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { scanTrackedFiles } from "./scan-tracked-secrets.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(repositoryRoot, "security-evidence");
const regressionFiles = [
  "extension/src/api-config.test.ts",
  "extension/src/capture-evidence.test.ts",
  "extension/src/capture-eligibility.test.ts",
  "extension/src/capture-export.test.ts",
  "extension/src/capture-session.test.ts",
  "extension/src/capture-storage.test.ts",
  "extension/src/capture-target-policy.test.ts",
  "extension/src/pilot-config.test.ts",
  "extension/src/receipt-view.test.ts",
  "extension/src/run-eligibility.test.ts",
  "extension/src/runtime/assertion-evaluator.test.ts",
  "extension/src/runtime/bounded-pattern.test.ts",
  "extension/src/runtime/chrome-executor-adapter.test.ts",
  "extension/src/runtime/interpreter.test.ts",
  "extension/src/runtime/run-transport.test.ts",
  "extension/controlled-run-harness.test.js",
  "extension/release-package.test.mjs",
  "app/features/workflows/run-history-panel.test.ts",
];

export async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const secretScan = await scanTrackedFiles();
  await writeFile(path.join(outputDirectory, "frontend-tracked-secrets.json"), `${JSON.stringify(secretScan, null, 2)}\n`, "utf8");
  if (secretScan.findings.length > 0) throw new Error(`Tracked secret scan found ${secretScan.findings.length} high-confidence credential candidate(s).`);

  const buildRun = spawnSync(process.execPath, ["extension/build.mjs"], { cwd: repositoryRoot, encoding: "utf8", env: process.env });
  if (buildRun.status !== 0) throw new Error(`${buildRun.stdout ?? ""}${buildRun.stderr ?? ""}`);
  const testRun = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-reporter=tap", ...regressionFiles], { cwd: repositoryRoot, encoding: "utf8", env: process.env });
  const rawEvidence = `${testRun.stdout ?? ""}${testRun.stderr ?? ""}`;
  await writeFile(path.join(outputDirectory, "frontend-security-regressions.tap"), rawEvidence, "utf8");
  if (testRun.status !== 0) {
    process.stderr.write(rawEvidence);
    throw new Error(`Frontend security regressions failed with exit code ${testRun.status ?? "unknown"}.`);
  }

  const release = await readReleaseEvidence();
  const archive = await readFile(path.join(repositoryRoot, "extension", "release", release.archive.filename));
  const archiveSha256 = createHash("sha256").update(archive).digest("hex");
  if (archiveSha256 !== release.archive.sha256) throw new Error("The extension archive checksum does not match its release evidence.");

  const sourceCommit = git(["rev-parse", "HEAD"]).trim();
  const sourceTreeDirty = git(["status", "--porcelain", "--untracked-files=all"]).trim().length > 0;
  const releaseMode = process.argv.includes("--release");
  const releaseBound = !sourceTreeDirty && release.sourceTreeDirty === false && release.sourceCommit === sourceCommit;
  const report = {
    schemaVersion: 1,
    format: "doonce.security-evidence.v1",
    repository: "frontend",
    generatedAt: new Date().toISOString(),
    sourceCommit,
    sourceTreeDirty,
    releaseBound,
    extension: { version: release.extensionVersion, packageSha256: archiveSha256, releaseSourceCommit: release.sourceCommit },
    checks: {
      trackedSecrets: { status: "passed", report: "frontend-tracked-secrets.json", scannedFiles: secretScan.scannedFiles },
      extensionSecurityBuild: { status: "passed", command: "node extension/build.mjs" },
      focusedRegressions: { status: "passed", report: "frontend-security-regressions.tap", files: regressionFiles },
      deterministicPackage: { status: "passed", releaseEvidence: `extension/release/doonce-extension-${release.extensionVersion}.release.json` },
    },
  };
  await writeFile(path.join(outputDirectory, "frontend-security-evidence.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  if (releaseMode && !releaseBound) throw new Error("Release security evidence requires a clean tree and extension package bound to the current commit.");
  process.stdout.write(`Frontend security evidence passed for ${sourceCommit}, extension sha256 ${archiveSha256}${releaseBound ? "" : " (development tree; CI must produce the release-bound report)"}.\n`);
}

async function readReleaseEvidence() {
  const releaseDirectory = path.join(repositoryRoot, "extension", "release");
  const candidates = (await readdir(releaseDirectory)).filter((name) => /^doonce-extension-\d+\.\d+\.\d+\.release\.json$/.test(name)).sort();
  if (candidates.length !== 1) throw new Error("Expected exactly one deterministic extension release evidence file.");
  return JSON.parse(await readFile(path.join(releaseDirectory, candidates[0]), "utf8"));
}

function git(args) {
  const safePath = repositoryRoot.replaceAll("\\", "/");
  const result = spawnSync("git", ["-c", `safe.directory=${safePath}`, ...args], { cwd: repositoryRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "Git security-evidence command failed.");
  return result.stdout;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
