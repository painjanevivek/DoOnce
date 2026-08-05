# DoOnce Safe Capture extension alpha

This Manifest V3 extension implements only consent-first onboarding. Load this folder as an unpacked Chrome extension for local testing.

## Current boundary

- It can read the current tab only while the user opens the extension (`activeTab`).
- It stores approved origins locally in Chrome extension storage.
- It does not request broad host permissions.
- After explicit consent, it injects a recorder into the current tab only. It stores at most 50 local summaries containing an approved origin, event kind, and selector—never a typed value or page content.
- It accepts HTTPS origins and the local DoOnce demo (`localhost`/`127.0.0.1`) only.

`capture-policy.js` is the fail-closed capture boundary for the next alpha increment. It permits only field metadata for explicitly safe controls and rejects passwords, OTP/security-code, payment, hidden, and file fields. Event summaries contain an event kind and selector only—never a typed value.

The recorder rejects password, OTP/security-code, payment, hidden, and file fields. It has no network API calls and does not execute workflow steps. Cloud sync requires a separate reviewed extension-to-API contract.

Users may explicitly download a local `doonce.safe-capture.v1` review file and import it into the dashboard. The dashboard validates its format and origin locally, then requires the user to review and create a normal server-validated draft; importing the file does not upload it.
