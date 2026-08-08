import assert from "node:assert/strict";
import test from "node:test";
import { captureExportFormat, createCaptureExport, legacyCaptureExportFormat, parseCaptureExport } from "./capture-export";

const action = { origin: "http://127.0.0.1:3000", path: "/demo/reports", eventKind: "click", selector: "#download-csv" } as const;

test("writes only capture export v2", () => {
  const capture = createCaptureExport([action], "2026-08-09T00:00:00.000Z");
  assert.equal(capture.format, captureExportFormat);
  assert.equal("summaries" in capture, false);
});

test("reads the legacy v1 fixture into the v2 shape", () => {
  const { path: _legacyMissingPath, ...legacyAction } = action;
  const result = parseCaptureExport({ format: legacyCaptureExportFormat, summaries: [legacyAction] });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.format, captureExportFormat);
    assert.equal(result.migratedFrom, legacyCaptureExportFormat);
    assert.deepEqual(result.value.actions, [{ ...legacyAction, path: "/" }]);
  }
});

test("rejects untrusted origins and malformed paths", () => {
  assert.equal(parseCaptureExport({ format: captureExportFormat, recordedAt: new Date().toISOString(), actions: [{ ...action, origin: "http://reports.example" }] }).ok, false);
  assert.equal(parseCaptureExport({ format: captureExportFormat, recordedAt: new Date().toISOString(), actions: [{ ...action, path: "/reports/../private" }] }).ok, false);
});
