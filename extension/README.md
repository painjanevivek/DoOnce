# DoOnce Browser Automation Extension

Version 0.3 records explicit, recoverable capture sessions with semantic element and page evidence. Pair it from the signed-in dashboard, approve a site, demonstrate the task, review the progressive timeline, stop, synchronize, and finalize the session. If connectivity is unavailable, the bounded local session remains available for automatic retry or JSON export.

This Manifest V3 extension records approved browser interactions and runs the controlled local report workflow. Run `npm run build:extension`, then load this folder as an unpacked Chrome extension.

## Current boundary

- It reads the current tab only while the user opens the extension (`activeTab`).
- It stores approved origins in local Chrome extension storage and requests no broad host permissions.
- It injects the recorder into the current approved tab only and keeps at most 50 local, value-free interaction summaries.
- It accepts HTTPS origins and the local DoOnce demo (`localhost`/`127.0.0.1`) only.
- Recording can be paused, resumed, or cleared explicitly from the popup.

Each summary contains a bounded relative path, event kind, stable locator candidate, and optional supported action hint. The service worker validates the sender origin and path before saving it. Query strings, typed values, and page content are never part of the capture contract.

`src/capture-eligibility.ts` is the fail-closed capture boundary. It rejects password, OTP/security-code, payment, hidden, and file fields. Cloud sync requires a separate reviewed extension-to-API contract.

The current runner is limited to the local `/demo/reports` CSV fixture. The user approves each run, the extension verifies the expected confirmation, and at most 20 redacted receipts are retained locally. Notifications use fixed text and never reflect raw page or error data.

Users can explicitly export `doonce.local-run-receipt.v1` receipts for dashboard review. New capture exports use `doonce.capture.v2`. The parser continues to read `doonce.safe-capture.v1` during one migration window, but the extension never writes the legacy format.

## Build and verification

- `npm run build:extension` creates browser-ready bundles in `extension/dist`.
- `npm run typecheck` validates the dashboard and strict extension TypeScript projects.
- `npm run test:extension` builds the extension, runs module tests, and replays the controlled browser bundle harness.
