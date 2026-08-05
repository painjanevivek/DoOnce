# DoOnce Safe Capture extension alpha

This Manifest V3 extension implements only consent-first onboarding. Load this folder as an unpacked Chrome extension for local testing.

## Current boundary

- It can read the current tab only while the user opens the extension (`activeTab`).
- It stores approved origins locally in Chrome extension storage.
- It does not request broad host permissions.
- It does not inject content scripts, record interactions, transmit page data, execute steps, or store credentials.
- It accepts HTTPS origins and the local DoOnce demo (`localhost`/`127.0.0.1`) only.

`capture-policy.js` is the fail-closed capture boundary for the next alpha increment. It permits only field metadata for explicitly safe controls and rejects passwords, OTP/security-code, payment, hidden, and file fields. Event summaries contain an event kind and selector only—never a typed value.

Recording may be added only after deterministic policy validation, sensitive-field exclusion, user-visible pause/cancel controls, and extension-to-API contract tests are in place.
