import assert from "node:assert/strict";
import test from "node:test";
import { buildCalibrationRequest, defaultCalibration, isVideoResponse, type CalibrationDraft, type VisualObservation } from "./video-authoring-types";

const observation: VisualObservation = { id: "11111111-1111-4111-8111-111111111111", sequence: 0, atMs: 1200, description: "Account field appears", textHints: ["Account name"], confidence: 0.35, normalizedBounds: { x: 0.2, y: 0.3, width: 0.4, height: 0.1 } };

test("builds semantic calibration without leaking visual coordinates into execution", () => {
  const draft: CalibrationDraft = { ...defaultCalibration(observation, "https://app.example.test/accounts"), action: "type", locatorStrategy: "label", locatorValue: "Account name", variableName: "account_name" };
  const request = buildCalibrationRequest("https://app.example.test/accounts", [observation], { [observation.id]: draft });
  assert.equal(JSON.stringify(request).includes("normalizedBounds"), false);
  assert.deepEqual(request.mappings[0], { observationId: observation.id, action: "type", domain: "app.example.test", path: "/accounts", locator: { schemaVersion: 1, primary: { strategy: "label", value: "Account name", confidence: 0.9 }, fallbacks: [] }, inputName: "account_name" });
});

test("allows uncertain visual moments to be excluded before compilation", () => {
  const draft = { ...defaultCalibration(observation, "https://app.example.test/"), included: false };
  assert.deepEqual(buildCalibrationRequest("https://app.example.test/", [observation], { [observation.id]: draft }).mappings, []);
});

test("rejects malformed API payloads at the client boundary", () => {
  assert.equal(isVideoResponse({ video: { id: "x", status: "invented" } }), false);
});
