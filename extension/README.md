# DoOnce Safe Capture extension alpha

This Manifest V3 extension implements only consent-first onboarding. Load this folder as an unpacked Chrome extension for local testing.

## Current boundary

- It can read the current tab only while the user opens the extension (`activeTab`).
- It stores approved origins locally in Chrome extension storage.
- It does not request broad host permissions.
- After explicit consent, it injects a recorder into the current tab only. It stores at most 50 local summaries containing an approved origin, event kind, and selector—never a typed value or page content.
- It accepts HTTPS origins and the local DoOnce demo (`localhost`/`127.0.0.1`) only.
- Recording can be paused or resumed explicitly from the popup; a paused site produces no new capture summaries until the user resumes it.

Each new summary also includes a bounded relative path. The service worker compares it with the sender tab's path before saving; query strings, typed values, and page content are not captured.

`capture-policy.js` is the fail-closed capture boundary for the next alpha increment. It permits only field metadata for explicitly safe controls and rejects passwords, OTP/security-code, payment, hidden, and file fields. Event summaries contain an event kind and selector only—never a typed value.

The recorder rejects password, OTP/security-code, payment, hidden, and file fields. It has no network API calls and does not execute workflow steps. Cloud sync requires a separate reviewed extension-to-API contract.

The one exception is a manual test fixture: after consent, the popup presents a pre-run review for the local `/demo/reports` CSV download only. The user must explicitly approve each run. The extension checks the exact local path and the fixture's explicit safe-action marker, pauses if the expected confirmation does not appear, and keeps at most 20 redacted receipts in local extension storage. It cannot run a captured workflow or any external site.

The extension uses Chrome's `notifications` permission only to show one fixed system message when that verified local run completes or pauses. The message contains no origin, page content, selector, typed value, raw error, password, OTP, or receipt identifier. If notifications are unavailable, the receipt and popup result still work normally.

The popup shows the latest local receipt's outcome, timestamp, and (when paused) one stable reason code. Invalid receipts are excluded before display and export, so it never displays raw page content, selectors, origins, typed values, or unrecognized error text.

Users may explicitly export `doonce.local-run-receipt.v1` JSON for dashboard review. The extension never uploads receipts automatically.

Users may explicitly download a local `doonce.safe-capture.v1` review file and import it into the dashboard. The dashboard validates its format and origin locally, then requires the user to review and create a normal server-validated draft; importing the file does not upload it.
