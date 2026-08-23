import assert from "node:assert/strict";
import test from "node:test";
import { resolveInstallDestination } from "./install-destination";

test("accepts only an official HTTPS Chrome Web Store detail page", () => {
  assert.deepEqual(
    resolveInstallDestination(
      "https://chromewebstore.google.com/detail/doonce/abcdefghijklmnop",
    ),
    {
      kind: "external",
      href: "https://chromewebstore.google.com/detail/doonce/abcdefghijklmnop",
    },
  );

  for (const value of [
    "http://chromewebstore.google.com/detail/doonce/example",
    "https://example.com/extension",
    "https://chromewebstore.google.com.evil.test/detail/doonce/example",
    "https://chromewebstore.google.com:444/detail/doonce/example",
    "https://chromewebstore.google.com/category/extensions",
    "javascript:alert(1)",
    undefined,
  ]) {
    assert.deepEqual(resolveInstallDestination(value), {
      kind: "unavailable",
      href: "/sign-up",
    });
  }
});
