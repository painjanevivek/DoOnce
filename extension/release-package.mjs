import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { readFile, readdir, rm, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const extensionDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.dirname(extensionDirectory);
const outputDirectory = path.join(extensionDirectory, "release");
const fixedDosDate = 33;
const expectedBundles = ["content-capture.js", "content-runner.js", "popup.js", "service-worker.js"];
const expectedPermissions = ["activeTab", "alarms", "downloads", "notifications", "scripting", "storage", "tabs"];
const staticFiles = ["notification-icon.svg", "popup.css", "popup.html"];
const crcTable = createCrcTable();

export function assertExactHttpsOrigin(value, label) {
  let url;
  try {
    url = new URL(value ?? "");
  } catch {
    throw new Error(`${label} must be one exact HTTPS origin.`);
  }
  if (url.protocol !== "https:" || url.origin !== value || url.pathname !== "/" || url.search || url.hash || url.port || url.username || url.password) {
    throw new Error(`${label} must be one exact HTTPS origin.`);
  }
  return url.origin;
}

export function createReleaseManifest(sourceManifest, { apiOrigin, pilotOrigin, extensionVersion }) {
  if (sourceManifest.manifest_version !== 3) throw new Error("The release manifest must use Manifest V3.");
  if (sourceManifest.version !== extensionVersion) throw new Error("DOONCE_EXTENSION_VERSION must match extension/manifest.json.");
  const permissions = [...(sourceManifest.permissions ?? [])].sort();
  if (JSON.stringify(permissions) !== JSON.stringify(expectedPermissions)) throw new Error("The extension permission set changed without release-policy review.");
  return {
    ...sourceManifest,
    permissions,
    host_permissions: [`${apiOrigin}/*`],
    optional_host_permissions: [`${pilotOrigin}/*`],
  };
}

export function assertSafePackageEntries(entries) {
  const allowedExtensions = new Set([".css", ".html", ".js", ".json", ".svg"]);
  for (const [name, contents] of entries) {
    if (name.includes("..") || name.includes("\\") || name.startsWith("/") || !allowedExtensions.has(path.posix.extname(name))) {
      throw new Error(`Release package contains an unapproved file: ${name}`);
    }
    if (name.endsWith(".map") || name.startsWith("dist/test/") || /(?:^|\/)(?:src|node_modules)\//.test(name)) {
      throw new Error(`Release package contains development material: ${name}`);
    }
    if (name.endsWith(".js")) {
      const source = contents.toString("utf8");
      for (const forbidden of ["//# sourceMappingURL=", "window.eval(", "globalThis.eval(", "(0, eval)(", "eval(\"", "eval('", "new Function(", "WebAssembly."]) {
        if (source.includes(forbidden)) throw new Error(`${name} contains forbidden executable behavior: ${forbidden}`);
      }
    }
  }
}

export function createDeterministicZip(inputEntries) {
  const entries = [...inputEntries].sort(([left], [right]) => left.localeCompare(right));
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  for (const [name, contents] of entries) {
    const filename = Buffer.from(name, "utf8");
    const data = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(fixedDosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(filename.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, filename, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(fixedDosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(filename.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, filename);
    localOffset += local.length + filename.length + data.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  const apiOrigin = assertExactHttpsOrigin(process.env.DOONCE_EXTENSION_API_BASE_URL, "DOONCE_EXTENSION_API_BASE_URL");
  const pilotOrigin = assertExactHttpsOrigin(process.env.DOONCE_EXTENSION_PILOT_ALLOWED_ORIGIN, "DOONCE_EXTENSION_PILOT_ALLOWED_ORIGIN");
  const extensionVersion = process.env.DOONCE_EXTENSION_VERSION;
  if (!/^\d+\.\d+\.\d+$/.test(extensionVersion ?? "")) throw new Error("DOONCE_EXTENSION_VERSION is required and must be semantic versioning without a prerelease suffix.");

  const sourceStatus = git(["status", "--porcelain", "--untracked-files=all", "--", "extension", "contracts", "docs/extension-data-inventory.md", "package.json", "package-lock.json"]);
  const sourceTreeDirty = sourceStatus.trim().length > 0;
  if (sourceTreeDirty && process.env.DOONCE_ALLOW_DIRTY_RELEASE !== "1") throw new Error("Extension release inputs are dirty. Commit the exact source before packaging.");

  runNode("extension/verify-controlled-run-evidence.js");
  const sourceManifest = JSON.parse(await readFile(path.join(extensionDirectory, "manifest.json"), "utf8"));
  const releaseManifest = createReleaseManifest(sourceManifest, { apiOrigin, pilotOrigin, extensionVersion });
  assertHandshakeVersion(extensionVersion);
  assertPrivacyDisclosure(await readFile(path.join(extensionDirectory, "REVIEWER_DISCLOSURE.md"), "utf8"));

  runNode("extension/build.mjs", ["--release"]);
  const firstBuild = await collectBuildEntries();
  runNode("extension/build.mjs", ["--release"]);
  const secondBuild = await collectBuildEntries();
  if (JSON.stringify(digests(firstBuild)) !== JSON.stringify(digests(secondBuild))) throw new Error("The release extension bundle is not deterministic.");

  const baseEntries = new Map();
  baseEntries.set("manifest.json", textBuffer(JSON.stringify(releaseManifest, null, 2) + "\n"));
  for (const filename of staticFiles) baseEntries.set(filename, await normalizedTextFile(path.join(extensionDirectory, filename)));
  for (const [name, value] of secondBuild) baseEntries.set(`dist/${name}`, value);
  assertSafePackageEntries(baseEntries);

  const protocolManifest = JSON.parse(await readFile(path.join(repositoryRoot, "contracts", "manifest.json"), "utf8"));
  const controlledEvidencePath = path.join(repositoryRoot, "docs", "reliability", "controlled-local-extension-runs.json");
  const privacyPath = path.join(extensionDirectory, "REVIEWER_DISCLOSURE.md");
  const sourceCommit = git(["rev-parse", "HEAD"]).trim();
  const evidence = {
    schemaVersion: 1,
    format: "doonce.extension-release.v1",
    extensionVersion,
    sourceCommit,
    sourceTreeDirty,
    apiOrigin,
    pilotOrigin,
    workflowCompilerVersion: "1.0.0",
    protocol: protocolManifest,
    controlledRunEvidence: { path: "docs/reliability/controlled-local-extension-runs.json", sha256: sha256(await readFile(controlledEvidencePath)) },
    privacyDisclosure: { path: "extension/REVIEWER_DISCLOSURE.md", sha256: sha256(await readFile(privacyPath)) },
    packagedFiles: digests(baseEntries),
  };
  const entries = new Map(baseEntries);
  entries.set("doonce-release-evidence.json", textBuffer(JSON.stringify(evidence, null, 2) + "\n"));
  assertSafePackageEntries(entries);
  const archive = createDeterministicZip(entries);
  const archiveName = `doonce-extension-${extensionVersion}.zip`;
  const archiveDigest = sha256(archive);
  const externalEvidence = { ...evidence, archive: { filename: archiveName, sha256: archiveDigest, bytes: archive.length } };
  const manifestDiff = {
    schemaVersion: 1,
    source: { host_permissions: sourceManifest.host_permissions, optional_host_permissions: sourceManifest.optional_host_permissions },
    release: { host_permissions: releaseManifest.host_permissions, optional_host_permissions: releaseManifest.optional_host_permissions },
  };

  await resetOutputDirectory();
  await writeFile(path.join(outputDirectory, archiveName), archive);
  await writeFile(path.join(outputDirectory, `${archiveName}.sha256`), `${archiveDigest}  ${archiveName}\n`, "utf8");
  await writeFile(path.join(outputDirectory, `doonce-extension-${extensionVersion}.release.json`), JSON.stringify(externalEvidence, null, 2) + "\n", "utf8");
  await writeFile(path.join(outputDirectory, `doonce-extension-${extensionVersion}.manifest-diff.json`), JSON.stringify(manifestDiff, null, 2) + "\n", "utf8");
  process.stdout.write(`Packaged ${archiveName} (${archive.length} bytes, sha256 ${archiveDigest}).\n`);
}

async function collectBuildEntries() {
  const directory = path.join(extensionDirectory, "dist");
  const names = (await readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  if (JSON.stringify(names) !== JSON.stringify(expectedBundles)) throw new Error(`Release bundles differ from the reviewed allowlist: ${names.join(", ")}`);
  return new Map(await Promise.all(names.map(async (name) => [name, await readFile(path.join(directory, name))])));
}

function digests(entries) {
  return Object.fromEntries([...entries].sort(([left], [right]) => left.localeCompare(right)).map(([name, contents]) => [name, { sha256: sha256(contents), bytes: contents.length }]));
}

function assertHandshakeVersion(extensionVersion) {
  const source = readFileSync(path.join(extensionDirectory, "src", "capture-sync.ts"), "utf8");
  if (!source.includes(`extensionVersion: "${extensionVersion}"`)) throw new Error("The capture protocol extension version does not match the release manifest.");
}

function assertPrivacyDisclosure(disclosure) {
  for (const section of ["Data collected", "Data excluded", "Permissions", "Retention and revocation", "Reviewer workflow"]) {
    if (!disclosure.includes(`## ${section}`)) throw new Error(`The reviewer privacy disclosure is missing: ${section}`);
  }
}

async function normalizedTextFile(filename) {
  return textBuffer((await readFile(filename, "utf8")).replace(/\r\n/g, "\n"));
}

function textBuffer(value) {
  return Buffer.from(value.replace(/\r\n/g, "\n"), "utf8");
}

async function resetOutputDirectory() {
  const resolved = path.resolve(outputDirectory);
  if (path.dirname(resolved) !== path.resolve(extensionDirectory)) throw new Error("Refusing to replace an extension release directory outside the extension workspace.");
  await rm(resolved, { recursive: true, force: true });
  await mkdir(resolved, { recursive: true });
}

function runNode(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: repositoryRoot, env: process.env, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${script} failed with exit code ${result.status ?? "unknown"}.`);
}

function git(args) {
  const safePath = repositoryRoot.replaceAll("\\", "/");
  const result = spawnSync("git", ["-c", `safe.directory=${safePath}`, ...args], { cwd: repositoryRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "Git release provenance command failed.");
  return result.stdout;
}

function createCrcTable() {
  return Array.from({ length: 256 }, (_, value) => {
    let crc = value;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    return crc >>> 0;
  });
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
