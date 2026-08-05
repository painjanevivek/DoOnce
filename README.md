# DoOnce dashboard

The DoOnce dashboard is the user-facing control plane for safe, reviewable browser workflows. It lets users inspect workflow versions, approvals and redacted receipts without hiding actions or granting unsafe defaults. The accompanying extension records only value-free summaries after per-site consent and offers one verified local report-download run.

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
- The extension can consent only HTTPS sites or the explicit local HTTP demo hosts; other URL schemes and public HTTP pages are rejected.
- A local extension receipt remains in the browser until the user explicitly chooses an active workflow and saves it. Saved histories are loaded only for the selected tenant workflow and contain no page content or action values.
- Imported paused receipts accept only the stable `changed-page`, `slow-network`, or `unknown` reason codes; malformed review files are rejected before they reach the API.
- Reconfirming an already-saved receipt does not create another record; the dashboard reports that it is already saved.
- An owner can select and immediately disable one active workflow after an explicit confirmation. The dashboard retains its history; a new reviewed draft is required before it can run again.
- Creating a repair draft only reconstructs the safe approved step as the next version. It never re-enables a workflow; the new draft needs a fresh policy preview and an explicit publication decision.
- Any signed-in tenant member can send a categorized problem report from the dashboard. It sends no page content, selector, typed value, attachment, password, OTP, or free-form diagnostic text.
- Removing extension consent clears that site's local captures, recording state, and local run receipts; data for other sites is retained.
- Select any workflow in the dashboard to inspect its server-confirmed draft, policy-preview, and publication history.
- Paused verified runs store a stable, redacted reason code (`changed-page`, `slow-network`, or `unknown`) while the extension shows a clear local explanation.
- The verified local demo run requires a fresh in-popup review and explicit approval every time. Its preview names the one allowed download and the verification condition before the action can start.
- After a verified local run completes or pauses, the extension can show one fixed system notification. It never contains page content, origins, selectors, typed values, receipt IDs, or raw errors.
- The dashboard can show bounded per-version reliability evidence from the newest 50 redacted receipts. It informs human review only; it does not enable scheduling or execution.
