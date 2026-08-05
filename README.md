# DoOnce dashboard

The DoOnce dashboard is the user-facing control plane for safe, reviewable browser workflows. It lets users inspect workflow versions, approvals and redacted receipts without hiding actions or granting unsafe defaults.

## Phase 1 foundation

The initial dashboard is a responsive safety shell. It intentionally does not pretend that recording or workflow execution is available before the extension, demo site and policy integration are ready.

## Local development

```text
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks

```text
npm run lint
npm run typecheck
npm run build
```

## Safety boundary

- Workflows stop when a page or action is uncertain.
- Passwords, OTPs, payment details, deletion and final submission are outside version 1.
- Reversible writes need a visible preview and explicit approval.
- A local extension receipt remains in the browser until the user explicitly chooses an active workflow and saves it. Saved histories are loaded only for the selected tenant workflow and contain no page content or action values.
- Reconfirming an already-saved receipt does not create another record; the dashboard reports that it is already saved.
