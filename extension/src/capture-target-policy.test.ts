import assert from "node:assert/strict";
import test from "node:test";
import { isProtectedCaptureTarget } from "./capture-target-policy";

test("excludes contenteditable, credential, OTP, and payment targets", () => {
  assert.equal(isProtectedCaptureTarget({ isContentEditable: true, tagName: "div" }), true);
  assert.equal(isProtectedCaptureTarget({ isContentEditable: false, tagName: "input", inputType: "password" }), true);
  assert.equal(isProtectedCaptureTarget({ isContentEditable: false, tagName: "input", autocomplete: "one-time-code" }), true);
  assert.equal(isProtectedCaptureTarget({ isContentEditable: false, tagName: "input", autocomplete: "cc-number" }), true);
  assert.equal(isProtectedCaptureTarget({ isContentEditable: false, tagName: "input", inputType: "text", name: "report_date" }), false);
});
