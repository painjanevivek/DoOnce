import assert from "node:assert/strict";
import test from "node:test";
import { normalizeExtensionApiBaseUrl } from "./api-config";

test("allows loopback only for development and requires a clean HTTPS release origin", () => {
  assert.equal(normalizeExtensionApiBaseUrl("http://127.0.0.1:4000", false), "http://127.0.0.1:4000");
  assert.equal(normalizeExtensionApiBaseUrl("https://api.example.test", true), "https://api.example.test");
  assert.throws(() => normalizeExtensionApiBaseUrl("http://api.example.test", false));
  assert.throws(() => normalizeExtensionApiBaseUrl("http://127.0.0.1:4000", true));
  assert.throws(() => normalizeExtensionApiBaseUrl("https://token@example.test/path", true));
});
