import assert from "node:assert/strict";
import test from "node:test";
import { motionAllowed } from "./motion-policy";

test("disables decorative motion when reduced motion is requested", () => {
  assert.equal(motionAllowed(true), false);
  assert.equal(motionAllowed(false), true);
});
