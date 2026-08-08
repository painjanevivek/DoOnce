# DoOnce dashboard

The DoOnce dashboard is the user-facing control plane for safe, reviewable browser workflows. It lets users inspect workflow versions, approvals and redacted receipts without hiding actions or granting unsafe defaults. The accompanying extension records only value-free summaries after per-site consent and offers one verified local report-download run.

## Phase 1 foundation

The initial dashboard is a responsive safety shell. It intentionally does not pretend that recording or workflow execution is available before the extension, demo site and policy integration are ready.

## Local development

```text
npm install
npm run dev
```

Open `http://localhost:3000`. The development server also permits the explicit loopback host `http://127.0.0.1:3000` for local browser tooling; no public development origins are allow-listed.

## Checks

```text
npm run lint
npm run typecheck
npm run build
```

GitHub Actions runs these checks, including the extension test suite, for pull requests and every push to `main`.

## Safety boundary

- Workflows stop when a page or action is uncertain.
- If the account service is temporarily unavailable, the header stops checking after four seconds and provides an explicit retry without changing session state.
- If the workflow catalog cannot be verified, it keeps workflow details hidden and offers a bounded, explicit workspace retry.
- After a successful sign-up or sign-in, the account page keeps the confirmation visible and offers one direct link to the authenticated workflow workspace.
- Passwords, OTPs, payment details, deletion and final submission are outside version 1.
- Reversible writes need a visible preview and explicit approval.
- The extension can consent only HTTPS sites or the explicit local HTTP demo hosts; other URL schemes and public HTTP pages are rejected.
- The dashboard safety status covers server validation for draft review and publication; the intentionally offline local extension demo remains a separate, manually approved fixture.
- The workflow workspace verifies the server safety status before showing tenant details. During a workflow-change freeze, it keeps inspection and emergency disable available but disables draft creation, policy previews, publication, and repair.
- The workspace also reads the server-confirmed membership role: owners can perform emergency disables, owners and builders can change workflows, runners can save local run receipts, and reviewers have read-only inspection access.
- A local extension receipt remains in the browser until the user explicitly chooses an active workflow and saves it. Saved histories are loaded only for the selected tenant workflow and contain no page content or action values.
- Before a draft can be published, the dashboard requires a completed local receipt to be confirmed for that exact draft version after its policy preview. A paused receipt never unlocks publication.
- The runnable pilot draft creator accepts only the local demo report target: `localhost` or `127.0.0.1` at `/demo/reports`. Other imported captures remain review-only until their workflow pattern is implemented and independently reviewed.
- Unpublished drafts can be resumed after a refresh from a tenant-scoped summary. The dashboard restores only server-derived policy-preview and completed-test status; it never treats local browser state as publication proof.
- Imported paused receipts accept only the stable `changed-page`, `slow-network`, or `unknown` reason codes; malformed review files are rejected before they reach the API.
- Reconfirming an already-saved receipt does not create another record; the dashboard reports that it is already saved.
- An owner can select and immediately disable one active workflow after an explicit confirmation. The dashboard retains its history; a new reviewed draft is required before it can run again.
- Creating a repair draft only reconstructs the safe approved step as the next version. It never re-enables a workflow; the new draft needs a fresh policy preview and an explicit publication decision.
- Any signed-in tenant member can send a categorized problem report from the dashboard. It sends no page content, selector, typed value, attachment, password, OTP, or free-form diagnostic text.
- A reporter may explicitly include the selected active workflow's server-derived run-health aggregate; it contains only bounded counts and stable pause codes, never receipt IDs or browser data.
- Support submissions are rate-limited. The dashboard tells users to wait rather than retrying automatically, so a report is never duplicated after a throttled response.
- Removing extension consent clears that site's local captures, recording state, and local run receipts; data for other sites is retained.
- Select a saved draft in the dashboard to resume its server-confirmed review, or select any workflow to inspect its publication history.
- The selected workflow's lifecycle history can be downloaded as a no-store JSON attachment. The export contains only tenant-scoped audited lifecycle events.
- Paused verified runs store a stable, redacted reason code (`changed-page`, `slow-network`, or `unknown`) while the extension shows a clear local explanation.
- The verified local demo run requires a fresh in-popup review and explicit approval every time. Its preview names the one allowed download and the verification condition before the action can start.
- After a verified local run completes or pauses, the extension can show one fixed system notification. It never contains page content, origins, selectors, typed values, receipt IDs, or raw errors.
- The dashboard can show bounded per-version reliability evidence from the newest 50 redacted receipts. It informs human review only; it does not enable scheduling or execution.

## Responsive workflow review

On narrow screens, workflow creation and lifecycle review controls form a single, full-width keyboard-accessible flow with 44px minimum interaction targets.
