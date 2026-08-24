# DoOnce extension reviewer disclosure

This engineering disclosure describes the invite-only attended MVP package. It must be reconciled with the founder-approved privacy notice and Chrome Web Store answers before submission.

## Data collected

- The exact approved HTTPS origin and value-free interaction kinds needed to compile one report-download workflow.
- Stable author-provided element identifiers when present, workflow/version/checksum identifiers, redacted step and assertion outcomes, download filename/type/size/checksum metadata, and bounded reason codes.
- A revocable pairing credential stored by Chrome; the API stores only its hash.

## Data excluded

The extension does not collect or transmit passwords, one-time codes, payment values, file inputs, contenteditable content, typed values, query strings, unrestricted page text, screenshots, DOM snapshots, browsing history, or fallback CSS selectors. Login, SSO, CAPTCHA, and MFA remain manual and outside recording and execution.

## Permissions

- `activeTab`, `scripting`, and the exact optional pilot host permission support user-initiated recording and attended execution on one authorized origin.
- `storage` preserves bounded pairing, consent, recovery checkpoint, and redacted receipt state.
- `downloads` correlates the one declared report download with its initiating action and verifies metadata.
- `tabs` detects origin, popup, and tab changes and pauses instead of broadening authority.
- `alarms` resumes bounded synchronization after service-worker suspension; `notifications` reports a fixed redacted terminal status.
- The production API host permission is limited to the exact HTTPS API origin compiled into the release package.

## Retention and revocation

Local capture summaries are bounded and removed for the selected origin on revocation. Revocation also removes the optional host permission, recording state, recovery state, approvals, and local receipts associated with that origin. Server retention follows the separately approved retention policy. Users can disable a workflow and report a problem without sending page content.

## Reviewer workflow

Use the named reviewer invitation and test site supplied out of band. Install the package, pair from the signed-in dashboard, grant the one displayed site permission, record the authorized report download, review and test the draft, publish it, approve one production run, and inspect its redacted receipt. Changed pages, missing elements, expired login, unexpected tabs/popups, slow downloads, API interruption, and revoked permission must pause safely.
