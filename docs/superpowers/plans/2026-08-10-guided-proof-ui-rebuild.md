# Guided Proof UI Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the complete DoOnce frontend presentation with an extension-first Guided Proof experience while preserving every tested workflow, account, contract, and execution behavior.

**Architecture:** Add a small shared site model, public shell, product shell, and isolated motion components around the existing typed workflow modules. Split the global stylesheet into token, foundation, marketing, product, and state layers; keep API calls and workflow state machines inside their current components. Public installation always enters through `/install`, which resolves an approved HTTPS distribution URL without claiming success when configuration is absent.

**Tech Stack:** Next.js 16 App Router, React 19, strict TypeScript, layered global CSS imported by the root layout, GSAP with `@gsap/react`, Node test runner through `tsx --test`, Playwright-driven visual QA.

## Global Constraints

- Preserve the existing `contracts/`, API response validation, authentication cookies, role checks, and WorkflowSpec behavior.
- Use Satoshi typography through Fontshare's official API. Do not redistribute the proprietary font files from the application server.
- Use deep ink, warm bone, and restrained electric-chartreuse tokens; all text and controls must remain readable in every state.
- Public pages follow Navigation, Attention, Interest, Desire, and Action; authenticated pages prioritize progressive task completion.
- The homepage title uses `.hero-title--wide`, `max-width: 78rem`, and `clamp(3.5rem, 7.4vw, 8rem)` and never exceeds three lines.
- The homepage bento uses 24 of 24 cells: `7 × 2`, `5 × 1`, and `5 × 1`, with `grid-auto-flow: dense`.
- Use only scrubbed text reveal and image scale/fade GSAP systems; reduced-motion users receive static final states.
- Do not add fake testimonials, partner logos, customer results, decorative stamps, generic meta-labels, or unverified performance claims.
- No public control may hide sign-in, privacy, terms, keyboard focus, loading, error, or disabled states.
- Install links route through `/install`; production requires `NEXT_PUBLIC_EXTENSION_INSTALL_URL` to use HTTPS on `chromewebstore.google.com`.
- Permit only `https://api.fontshare.com` for the Fontshare stylesheet and `https://cdn.fontshare.com` for its font files in the content-security policy.

---

## File Map

**Create**

- `docs/licenses/SATOSHI.md` - typeface source, license link, API URL, and fallback behavior.
- `app/styles/tokens.css` - color, typography, spacing, elevation, focus, and motion variables.
- `app/styles/foundation.css` - reset, body, shared controls, accessibility, navigation, and footer.
- `app/styles/marketing.css` - homepage, install, account, and legal presentation.
- `app/styles/product.css` - workflow library and studio layout.
- `app/styles/states.css` - skeleton, empty, degraded, unavailable, and error states.
- `app/features/site/site-content.ts` - immutable authoring, task, and scenario copy.
- `app/features/site/site-content.test.ts` - content integrity and banned-label tests.
- `app/features/site/install-destination.ts` and `.test.ts` - safe extension URL resolution.
- `app/features/site/extension-install-cta.tsx` - reusable internal/external installation control.
- `app/features/site/site-header.tsx` and `site-footer.tsx` - shared public chrome.
- `app/features/site/install-panel.tsx` and `install-panel.test.ts` - configured/unavailable installation states.
- `app/features/site/landing-page.tsx` and `landing-page.test.ts` - AIDA composition.
- `app/features/site/authoring-accordion.tsx` - three keyboard-operable authoring paths.
- `app/features/site/scenario-carousel.tsx` - example persona carousel without fabricated claims.
- `app/features/site/guided-proof-motion.tsx` and `motion-policy.test.ts` - GSAP lifecycle and reduced-motion policy.
- `app/features/site/system-state.tsx` and `system-state.test.ts` - reusable error/not-found presentation.
- `app/features/workflows/workflow-library-view.tsx` and `.test.ts` - presentational library shell.
- `app/features/workflows/workflow-workspace.tsx` and `.test.ts` - three-region studio shell.
- `app/install/page.tsx` - truthful extension acquisition page.

**Modify**

- `package.json`, `package-lock.json` - add GSAP dependencies and site tests.
- `.env.example` - document `NEXT_PUBLIC_EXTENSION_INSTALL_URL`.
- `app/layout.tsx` and `app/globals.css` - official Fontshare API link and layered style imports.
- `next.config.ts` - narrowly allow Fontshare's stylesheet and font CDN origins.
- `app/page.tsx`, `app/sign-up/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx` - new public compositions.
- `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx` - shared system states.
- `app/workflows/page.tsx`, `app/workflows/[id]/page.tsx` - shared product navigation.
- `app/features/workflows/workflow-library.tsx` - preserve data logic while delegating presentation.
- `app/features/workflows/workflow-studio.tsx` - preserve state logic while using the workspace shell.

---

### Task 1: Guided Proof foundation and content model

**Files:**
- Create: `docs/licenses/SATOSHI.md`
- Create: `app/styles/tokens.css`
- Create: `app/styles/foundation.css`
- Create: `app/features/site/site-content.ts`
- Test: `app/features/site/site-content.test.ts`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `next.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `AuthoringPath`, `ExampleScenario`, `authoringPaths`, `exampleScenarios`, and `taskExamples` for public components.
- Produces: CSS variables rooted at `--ink`, `--bone`, `--signal`, `--font-satoshi`, and shared focus/control classes.

- [x] **Step 1: Add the test command and write failing content tests**

Replace the `test:extension` script with `npm run build:extension && tsx --test extension/src/*.test.ts extension/src/runtime/*.test.ts app/features/site/*.test.ts app/features/workflows/*.test.ts && node --test extension/controlled-run-harness.test.js`, then create:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { authoringPaths, exampleScenarios, taskExamples } from "./site-content";

test("publishes three distinct authoring paths without fabricated proof", () => {
  assert.deepEqual(authoringPaths.map((item) => item.id), ["record", "describe", "video"]);
  assert.equal(new Set(authoringPaths.map((item) => item.title)).size, 3);
  assert.ok(exampleScenarios.every((item) => item.kind === "example"));
  assert.ok(taskExamples.length >= 5);
});

test("avoids banned generic labels and customer claims", () => {
  const copy = JSON.stringify({ authoringPaths, exampleScenarios, taskExamples });
  assert.doesNotMatch(copy, /SECTION \d|QUESTION \d|trusted by|customer says/i);
});
```

- [x] **Step 2: Run the focused test and verify it fails**

Run: `npx tsx --test app/features/site/site-content.test.ts`

Expected: FAIL because `site-content.ts` does not exist.

- [x] **Step 3: Implement the immutable content model**

```ts
export interface AuthoringPath {
  id: "record" | "describe" | "video";
  title: string;
  summary: string;
  proof: string;
}

export interface ExampleScenario {
  kind: "example";
  role: string;
  task: string;
  authoring: AuthoringPath["id"];
  verification: string;
  artifact: string;
}

export const authoringPaths = Object.freeze([
  { id: "record", title: "Show it in Chrome", summary: "Record one careful demonstration.", proof: "Review every captured action before publishing." },
  { id: "describe", title: "Describe the routine", summary: "Explain the task in plain language.", proof: "DoOnce compiles an editable draft, never an automatic publish." },
  { id: "video", title: "Upload a short walkthrough", summary: "Use an existing demonstration video.", proof: "Calibrate uncertain moments before creating a draft." },
] satisfies AuthoringPath[]);
```

Define these exact task examples using a frozen string array: `Download weekly invoices`, `Update a recruiting tracker`, `Copy order exceptions into a report`, `Reconcile portal totals`, and `Prepare a recurring compliance export`.

Define three frozen `ExampleScenario` records:

- Operations coordinator: record downloading weekly supplier invoices; verify every expected supplier appears; artifact is a timestamped invoice bundle.
- Recruiting coordinator: describe copying shortlisted candidates into a tracker; verify required columns are populated; artifact is an updated recruiting sheet.
- Finance analyst: upload a walkthrough of reconciling portal totals; verify the source and destination totals match; artifact is a reconciliation report.

- [x] **Step 4: Add licensed font delivery, tokens, and root font wiring**

Use Fontshare's official API stylesheet so the application does not redistribute the proprietary font files. Add this to the root layout `<head>` and use a resilient system fallback:

```tsx
<link
  href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap"
  rel="stylesheet"
/>
```

Set `--font-satoshi: "Satoshi", "Segoe UI", Arial, sans-serif`. Update production CSP `style-src` with `https://api.fontshare.com` and `font-src` with `https://cdn.fontshare.com`; do not broaden any other directive. Document the official font page, ITF license URL, API URL, retrieval date, and system fallback in `docs/licenses/SATOSHI.md`. Import the new style layers from `globals.css`. Define semantic tokens rather than raw colors inside components.

- [x] **Step 5: Run foundation verification**

Run: `npx tsx --test app/features/site/site-content.test.ts && npm run typecheck && npm run lint`

Expected: all commands pass with no contract drift.

- [x] **Step 6: Commit**

```text
feat(design-system): add guided proof foundation

- add licensed local typography and semantic design tokens
- define truthful authoring, task, and persona content models
- include site content tests in the frontend verification suite
```

### Task 2: Truthful Chrome extension acquisition

**Files:**
- Create: `app/features/site/install-destination.ts`
- Test: `app/features/site/install-destination.test.ts`
- Create: `app/features/site/extension-install-cta.tsx`
- Create: `app/features/site/install-panel.tsx`
- Test: `app/features/site/install-panel.test.ts`
- Create: `app/features/site/site-header.tsx`
- Create: `app/features/site/site-footer.tsx`
- Create: `app/install/page.tsx`
- Modify: `.env.example`

**Interfaces:**
- Produces: `resolveInstallDestination(value?: string): InstallDestination`.
- Produces: `ExtensionInstallCta({ destination, label })` and `InstallPanel({ destination })`.
- Consumes: existing `AccountStatus` and legal routes.

- [x] **Step 1: Write failing destination tests**

```ts
test("accepts only the official HTTPS Chrome Web Store destination", () => {
  assert.deepEqual(resolveInstallDestination("https://chromewebstore.google.com/detail/doonce/example"), {
    kind: "external",
    href: "https://chromewebstore.google.com/detail/doonce/example",
  });
  assert.deepEqual(resolveInstallDestination("http://example.com/extension"), { kind: "unavailable", href: "/sign-up" });
  assert.deepEqual(resolveInstallDestination("https://example.com/extension"), { kind: "unavailable", href: "/sign-up" });
  assert.deepEqual(resolveInstallDestination("https://chromewebstore.google.com.evil.test/extension"), { kind: "unavailable", href: "/sign-up" });
  assert.deepEqual(resolveInstallDestination(undefined), { kind: "unavailable", href: "/sign-up" });
});
```

- [x] **Step 2: Run tests and confirm the missing-module failure**

Run: `npx tsx --test app/features/site/install-destination.test.ts`

Expected: FAIL because the resolver is absent.

- [x] **Step 3: Implement safe resolution**

```ts
export type InstallDestination =
  | { kind: "external"; href: string }
  | { kind: "unavailable"; href: "/sign-up" };

export function resolveInstallDestination(value = process.env.NEXT_PUBLIC_EXTENSION_INSTALL_URL): InstallDestination {
  try {
    const url = new URL(value ?? "");
    const allowed = url.protocol === "https:" && url.hostname === "chromewebstore.google.com";
    return allowed ? { kind: "external", href: url.href } : { kind: "unavailable", href: "/sign-up" };
  } catch {
    return { kind: "unavailable", href: "/sign-up" };
  }
}
```

- [x] **Step 4: Test and build configured/unavailable install panels**

Server-render both states and assert that external links include `target="_blank"` and `rel="noreferrer noopener"`, while unavailable state contains “Extension distribution is not configured” and links to `/sign-up`.

- [x] **Step 5: Add shared site chrome and `/install`**

Use `SiteHeader` on public pages. All install buttons link internally to `/install`; only `InstallPanel` emits the external destination. Document `NEXT_PUBLIC_EXTENSION_INSTALL_URL=` in `.env.example` with an HTTPS-only production note.

- [x] **Step 6: Verify and commit**

Run: `npm run test:extension && npm run typecheck && npm run lint`

```text
feat(install): add truthful extension acquisition

- route public installation through a first-party setup page
- validate external distribution destinations before rendering links
- provide an honest sign-up fallback when distribution is unavailable
```

### Task 3: Rebuild the homepage around Guided Proof

**Files:**
- Create: `app/features/site/landing-page.tsx`
- Test: `app/features/site/landing-page.test.ts`
- Create: `app/features/site/authoring-accordion.tsx`
- Create: `app/features/site/scenario-carousel.tsx`
- Create: `app/features/site/guided-proof-motion.tsx`
- Create: `app/styles/marketing.css`
- Modify: `app/page.tsx`
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: shared content arrays, `SiteHeader`, `SiteFooter`, and internal `/install` CTA.
- Produces: `LandingPage`, `AuthoringAccordion`, `ScenarioCarousel`, and `GuidedProofMotion`.

- [x] **Step 1: Write a failing server-rendered AIDA test**

```ts
const html = renderToStaticMarkup(createElement(LandingPage));
assert.match(html, /Teach the browser once/);
assert.match(html, /href="\/install"/);
assert.match(html, /guided-proof-bento/);
assert.match(html, /authoring-accordion/);
assert.match(html, /example scenario/i);
assert.doesNotMatch(html, /SECTION \d|trusted by/i);
```

- [x] **Step 2: Run the focused test and verify failure**

Run: `npx tsx --test app/features/site/landing-page.test.ts`

Expected: FAIL because `LandingPage` is missing.

- [x] **Step 3: Install and register motion dependencies**

Run: `npm install gsap@^3 @gsap/react@^2`

Keep GSAP imports inside `guided-proof-motion.tsx`; no workflow component may depend on GSAP.

- [x] **Step 4: Implement the complete AIDA composition**

Build one semantic `<main className="guided-proof-page">` containing hero, 24-cell bento, task marquee, authoring accordion, scrubbed narrative, scenario carousel, install action, and footer. Use real product-language compositions made from HTML/CSS rather than fake screenshots.

- [x] **Step 5: Implement exact bento geometry and hero constraints**

```css
.guided-proof-bento { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(15rem, auto)); grid-auto-flow: dense; }
.proof-card--record { grid-column: span 7; grid-row: span 2; }
.proof-card--compile, .proof-card--verify { grid-column: span 5; grid-row: span 1; }
.hero-title--wide { width: 100%; max-width: 78rem; font-size: clamp(3.5rem, 7.4vw, 8rem); }
```

At mobile widths, convert cards to one column in source order without absolute positioning.

- [x] **Step 6: Implement keyboard accordion and carousel behavior**

Use buttons with `aria-expanded`, labelled panels, roving carousel controls, and live-region-free slide updates. All scenario cards must say “Example scenario”; do not render quotation marks or customer attribution.

- [x] **Step 7: Verify and commit**

Run: `npm run test:extension && npm run typecheck && npm run lint && npm run build`

```text
feat(marketing): rebuild the guided proof homepage

- lead with an extension-first asymmetric product narrative
- add a mathematically complete workflow proof grid
- explain authoring paths and example scenarios without fabricated claims
```

### Task 4: Align account, legal, and system states

**Files:**
- Create: `app/features/site/system-state.tsx`
- Test: `app/features/site/system-state.test.ts`
- Create: `app/styles/states.css`
- Modify: `app/sign-up/page.tsx`
- Modify: `app/privacy/page.tsx`
- Modify: `app/terms/page.tsx`
- Modify: `app/not-found.tsx`
- Modify: `app/error.tsx`
- Modify: `app/global-error.tsx`
- Modify: `app/components/account-form.tsx`

**Interfaces:**
- Produces: `SystemState({ eyebrow, title, message, action })` for error and empty surfaces.
- Consumes: existing account endpoints and form handlers without changing payloads.

- [ ] **Step 1: Write failing static-state tests**

Assert that `SystemState` renders a heading, recovery message, action link, and no marketing motion hooks. Add account-form assertions for visible labels, autocomplete, error association, and preserved submit behavior.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npx tsx --test app/features/site/system-state.test.ts`

Expected: FAIL because `system-state.tsx` is absent.

- [ ] **Step 3: Implement public supporting pages**

Use the shared header/footer and two-column account/install composition. Keep privacy and terms content unchanged; only restructure landmarks and visual hierarchy. Each error states what happened, what remains preserved, and the next action.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:extension && npm run typecheck && npm run lint && npm run build`

```text
feat(account): align public and recovery experiences

- apply the guided proof system to account and legal pages
- add reusable accessible error and not-found states
- preserve account behavior while improving form hierarchy
```

### Task 5: Redesign the workflow library with progressive disclosure

**Files:**
- Create: `app/features/workflows/workflow-library-view.tsx`
- Test: `app/features/workflows/workflow-library-view.test.ts`
- Create: `app/styles/product.css`
- Modify: `app/workflows/page.tsx`
- Modify: `app/features/workflows/workflow-library.tsx`
- Modify: `app/components/account-status.tsx`

**Interfaces:**
- Produces: `WorkflowLibraryView({ workflows, state, activeMode, onModeChange, children })`.
- Consumes: existing `Workflow`, account role, capabilities, authoring panels, and API handlers.

- [ ] **Step 1: Write a failing presentation test**

Server-render `WorkflowLibraryView` with one workflow and assert presence of workflow title, status, latest action area, creation modes, and a `<details>` disclosure for advanced evidence. Assert audit, scheduling, beta, and support labels are not expanded by default.

- [ ] **Step 2: Run test and verify the missing-component failure**

Run: `npx tsx --test app/features/workflows/workflow-library-view.test.ts`

Expected: FAIL because the view component does not exist.

- [ ] **Step 3: Extract presentation without changing data behavior**

Keep fetch, validation, authorization, abort, and mutation functions in `workflow-library.tsx`. Pass validated data and existing panels into `WorkflowLibraryView`. The initial viewport contains: library heading, create-workflow control, workflow list, current status, and next action. Place evidence, schedules, repair, beta, and support in labelled native disclosures.

- [ ] **Step 4: Implement responsive product shell**

Use a compact product header, clear selected state, minimum 44px targets, table-to-card adaptation below 760px, and independent loading/error regions. Do not let beta or audit failure replace the workflow list.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:extension && npm run typecheck && npm run lint && npm run build`

```text
feat(workflows): redesign the workflow library

- prioritize workflow status and next actions in the initial view
- progressively disclose evidence, scheduling, repair, and beta controls
- preserve validated API and role behavior behind the new presentation
```

### Task 6: Build the focused three-region workflow studio

**Files:**
- Create: `app/features/workflows/workflow-workspace.tsx`
- Test: `app/features/workflows/workflow-workspace.test.ts`
- Modify: `app/workflows/[id]/page.tsx`
- Modify: `app/features/workflows/workflow-studio.tsx`

**Interfaces:**
- Produces: `WorkflowWorkspace({ outline, canvas, inspector, activeRegion, onRegionChange })`.
- Consumes: current editor history, WorkflowSpec, validation issues, run state, versions, and all existing editor panels.

- [ ] **Step 1: Write failing workspace layout tests**

Render the workspace with three labelled regions. Assert desktop landmarks, mobile tab buttons with `aria-selected`, one `h1`, and stable source order: outline, canvas, inspector.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx tsx --test app/features/workflows/workflow-workspace.test.ts`

Expected: FAIL because the workspace component is missing.

- [ ] **Step 3: Introduce the workspace shell without moving state ownership**

Keep loading, saving, undo/redo, publish, testing, versioning, and validation in `workflow-studio.tsx`. Supply the current outline, step editor, and contextual panels as region nodes. Desktop uses three columns; narrow widths display one region at a time through accessible tabs while retaining mounted form state.

- [ ] **Step 4: Collapse secondary tools deliberately**

The canvas shows the selected step and validation first. The inspector exposes inputs, assertions, versions, runs, schedules, repair, and evidence through named disclosures. Publish and run buttons keep their current server-confirmed behavior and disabled reasons.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:extension && npm run typecheck && npm run lint && npm run build`

```text
feat(studio): add a focused workflow workspace

- organize editing into outline, canvas, and contextual inspector regions
- add an accessible narrow-screen region switcher
- retain workflow state, validation, publishing, and run behavior
```

### Task 7: Motion, responsiveness, accessibility, and final visual verification

**Files:**
- Modify: `app/features/site/guided-proof-motion.tsx`
- Test: `app/features/site/motion-policy.test.ts`
- Modify: `app/styles/foundation.css`
- Modify: `app/styles/marketing.css`
- Modify: `app/styles/product.css`
- Modify: `app/styles/states.css`

**Interfaces:**
- Produces: `motionAllowed(prefersReducedMotion: boolean): boolean` and a cleanup-safe `GuidedProofMotion` client boundary.
- Consumes: data attributes emitted by `LandingPage`; no workflow state.

- [ ] **Step 1: Write the reduced-motion policy test**

```ts
test("disables decorative motion when reduced motion is requested", () => {
  assert.equal(motionAllowed(true), false);
  assert.equal(motionAllowed(false), true);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npx tsx --test app/features/site/motion-policy.test.ts`

Expected: FAIL until the policy is exported.

- [ ] **Step 3: Implement GSAP lifecycle and static fallback**

Use `useGSAP` with a scoped root, register `ScrollTrigger` once, call `gsap.matchMedia()`, and revert the context during cleanup. Animate only `[data-reveal-word]` opacity and `[data-proof-media]` scale/opacity. CSS must render both selectors fully visible by default and inside `prefers-reduced-motion: reduce`.

- [ ] **Step 4: Run the complete automated suite**

Run:

```text
npm run typecheck
npm run lint
npm run test:extension
npm run verify:controlled-runs
npm run build
npm audit --omit=dev --audit-level=high
```

Expected: all commands exit zero; controlled evidence remains bound to current extension source.

- [ ] **Step 5: Perform desktop visual QA**

Start the production build with `npm run start -- --port 3107`. At 1440×1000, inspect `/`, `/install`, `/sign-up`, `/workflows`, and one `/workflows/{id}` state. Confirm the hero is at most three lines, all bento cells are filled, motion initializes without console errors, and the workflow controls remain reachable. Stop only this server process after QA.

- [ ] **Step 6: Perform mobile and reduced-motion visual QA**

At 390×844, confirm no horizontal overflow, no clipped text, 44px targets, readable forms, stacked bento order, usable workflow region tabs, and complete content with reduced motion enabled. Capture screenshots for the handoff.

- [ ] **Step 7: Commit final hardening**

```text
fix(ui): harden guided proof responsiveness

- complete reduced-motion and keyboard interaction states
- remove responsive overflow and hierarchy regressions
- verify public and workflow surfaces across production breakpoints
```

## Final Release Gate

- [ ] `git diff --check` reports no whitespace or conflict errors.
- [ ] Frontend worktree contains only intentional changes.
- [ ] Every commit uses `feat(scope): summary`, `fix(scope): summary`, or `test(scope): summary` with a bullet-list body.
- [ ] Chrome extension installation is the dominant public action and never claims installation without an approved HTTPS destination.
- [ ] The final GitHub Actions run passes lint, typecheck, tests, controlled-run verification, production Docker build, SBOM generation, and critical vulnerability scanning.
