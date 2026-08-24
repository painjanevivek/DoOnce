import assert from "node:assert/strict";
import test from "node:test";
import {
  assertExactHttpsOrigin,
  assertSafePackageEntries,
  createDeterministicZip,
  createReleaseManifest,
  sha256,
} from "./release-package.mjs";

const sourceManifest = {
  manifest_version: 3,
  name: "DoOnce",
  version: "0.4.0",
  permissions: ["tabs", "storage", "scripting", "notifications", "alarms", "downloads", "activeTab"],
  host_permissions: ["http://localhost:4000/*"],
  optional_host_permissions: ["http://*/*", "https://*/*"],
};

test("accepts only one exact public HTTPS origin", () => {
  assert.equal(assertExactHttpsOrigin("https://api.example.com", "API"), "https://api.example.com");
  for (const value of ["http://api.example.com", "https://api.example.com/path", "https://api.example.com:444", "https://user@api.example.com", "https://api.example.com?debug=1"]) {
    assert.throws(() => assertExactHttpsOrigin(value, "API"), /exact HTTPS origin/);
  }
});

test("replaces broad development hosts with exact release permissions", () => {
  const manifest = createReleaseManifest(sourceManifest, {
    apiOrigin: "https://api.example.com",
    pilotOrigin: "https://reports.example.com",
    extensionVersion: "0.4.0",
  });
  assert.deepEqual(manifest.host_permissions, ["https://api.example.com/*"]);
  assert.deepEqual(manifest.optional_host_permissions, ["https://reports.example.com/*"]);
  assert.throws(() => createReleaseManifest(sourceManifest, { apiOrigin: "https://api.example.com", pilotOrigin: "https://reports.example.com", extensionVersion: "0.4.1" }), /must match/);
});

test("creates byte-identical archives from sorted, timestamp-free inputs", () => {
  const left = createDeterministicZip(new Map([["b.js", Buffer.from("b")], ["a.json", Buffer.from("a")]]));
  const right = createDeterministicZip(new Map([["a.json", Buffer.from("a")], ["b.js", Buffer.from("b")]]));
  assert.equal(left.readUInt32LE(0), 0x04034b50);
  assert.equal(sha256(left), sha256(right));
});

test("rejects source maps, source trees, and dynamic code primitives", () => {
  assert.throws(() => assertSafePackageEntries(new Map([["dist/popup.js.map", Buffer.from("{}")]])), /unapproved|development/);
  assert.throws(() => assertSafePackageEntries(new Map([["src/popup.js", Buffer.from("ok")]])), /development/);
  assert.throws(() => assertSafePackageEntries(new Map([["dist/popup.js", Buffer.from("eval('x')")]])), /forbidden executable behavior/);
});
