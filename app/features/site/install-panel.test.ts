import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ExtensionInstallCta } from "./extension-install-cta";
import { InstallPanel } from "./install-panel";

test("keeps public install calls on the first-party install route", () => {
  const html = renderToStaticMarkup(createElement(ExtensionInstallCta));

  assert.match(html, /href="\/install"/);
  assert.match(html, /Install the Chrome extension/);
  assert.doesNotMatch(html, /target="_blank"/);
});

test("opens a validated store destination with isolated tab access", () => {
  const html = renderToStaticMarkup(
    createElement(InstallPanel, {
      destination: {
        kind: "external",
        href: "https://chromewebstore.google.com/detail/doonce/abcdefghijklmnop",
      },
    }),
  );

  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noreferrer noopener"/);
  assert.match(html, /Continue to the Chrome Web Store/);
  assert.doesNotMatch(html, /installed successfully/i);
});

test("explains unavailable distribution and offers a truthful fallback", () => {
  const html = renderToStaticMarkup(
    createElement(InstallPanel, {
      destination: { kind: "unavailable", href: "/sign-up" },
    }),
  );

  assert.match(html, /Extension distribution is not configured/);
  assert.match(html, /href="\/sign-up"/);
  assert.doesNotMatch(html, /target="_blank"/);
});
