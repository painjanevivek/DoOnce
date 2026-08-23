# Extension data inventory

| Data | Purpose | Location | Transfer | Retention/control |
|---|---|---|---|---|
| Approved origins | Limit capture and execution | Chrome local storage | Not transferred alone | Removed by site revocation |
| Semantic capture events | Build a reviewable draft | Chrome local storage, then API after pairing | HTTPS beta API | Bounded session; discard/revoke clears local copy |
| Pairing credential | Authenticate one user/tenant extension | Chrome local storage; server stores a hash | Authorization header over HTTPS | Revocable; server expiry applies |
| WorkflowSpec and lease | Execute a published version | Chrome memory/session storage | HTTPS beta API | Lease expires; checkpoint removed after terminal result |
| Redacted result/evidence | Verify the declared outcome | Chrome/API artifact storage | HTTPS beta API | Retention class; no page bodies or typed values |

The extension excludes contenteditable fields, passwords, one-time codes, payment fields, secrets, hidden controls, query strings, and unrestricted page content. Removing an origin stops capture, removes the optional host permission, clears that origin’s summaries and receipts, and discards any multi-origin local session containing it.

Store disclosures, the product privacy notice, and reviewer instructions must match this inventory before distribution. This is an engineering inventory, not an approved legal notice.
