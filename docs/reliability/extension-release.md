# Extension release and controlled distribution

This procedure packages and distributes one immutable attended-MVP extension. It does not authorize a target site or replace Chrome Web Store, privacy, or legal approval.

## Build the exact release

Start from a clean, reviewed commit and set the three release values:

```powershell
$env:DOONCE_EXTENSION_API_BASE_URL = "https://api.example.com"
$env:DOONCE_EXTENSION_PILOT_ALLOWED_ORIGIN = "https://reports.example.com"
$env:DOONCE_EXTENSION_VERSION = "0.4.0"
npm ci
npm run package:extension:release
npm sbom --sbom-format cyclonedx > extension/release/doonce-extension-0.4.0.sbom.json
```

The packager fails on dirty release inputs, a non-HTTPS or non-exact origin, manifest/protocol version mismatch, unreviewed permissions, missing reviewer disclosure, stale controlled-run evidence, nondeterministic bundles, source maps, source/test trees, unapproved files, or common dynamic-code primitives. It emits:

- `doonce-extension-<version>.zip`
- `doonce-extension-<version>.zip.sha256`
- `doonce-extension-<version>.release.json`
- `doonce-extension-<version>.manifest-diff.json`
- the separately generated CycloneDX SBOM and CI vulnerability-scan report

Rebuild from the same commit and environment and compare the ZIP SHA-256 before distribution. Retain both runs when establishing reproducibility evidence.

## Preferred unlisted Chrome Web Store path

The founder supplies the publisher account owner, support contact, final extension ID, approved privacy answers, and submission approval. Upload only the generated ZIP. Confirm the store manifest matches the emitted manifest diff, then configure:

- backend `DOONCE_EXTENSION_ORIGINS=chrome-extension://<final-extension-id>` with no wildcard or prior ID;
- frontend `NEXT_PUBLIC_EXTENSION_INSTALL_URL=https://chromewebstore.google.com/detail/<listing-name>/<final-extension-id>`;
- the release record with store version, package checksum, source commits, protocol/compiler versions, reviewer evidence, and publication status.

Do not mark `/install` available until the unlisted detail page works for the named pilot accounts.

## Controlled manual fallback

Use this only for the three named participants while store review is pending:

1. Send the versioned ZIP and its `.sha256` file through the approved pilot channel.
2. Have the participant calculate SHA-256 locally and compare the complete value before extracting.
3. Extract into a new version-named directory; open `chrome://extensions`, enable Developer mode, and choose **Load unpacked** for that directory.
4. Record participant, Chrome version, extension ID/version, package SHA-256, installation time, and verifier initials. Do not collect browser-profile paths or credentials.
5. Pair through the dashboard and grant only the displayed exact pilot origin. If any requested origin or permission differs, stop.
6. On update, verify the new checksum, remove the previous unpacked version, load the new directory, and rerun pairing/revocation checks.
7. On exit, revoke the origin, remove the extension, delete the extracted directory and ZIP, and record completion.

The fallback must be replaced by the store path before any broader beta.

## Clean-profile compatibility evidence

Run this matrix on current stable and previous stable desktop Chrome. Use a fresh profile without pilot credentials preloaded; the tester performs login/MFA manually.

| Case | Stable | Previous stable | Evidence required |
|---|---|---|---|
| Install exact package | Pending | Pending | Chrome version, extension ID/version, checksum |
| Exact permission grant and pairing | Pending | Pending | Redacted screenshot/log reference |
| Service-worker suspension and resume | Pending | Pending | Checkpoint/recovery receipt |
| Offline capture sync and recovery | Pending | Pending | Bounded sync result |
| Origin revoke and scoped cleanup | Pending | Pending | Permission/storage check |
| Update without permission expansion | Pending | Pending | Manifest diff and resulting version |
| Uninstall/reinstall and re-pair | Pending | Pending | Revoked old token and new connection |

Every row records tester, UTC timestamp, OS, Chrome version, release manifest SHA-256, result, and evidence reference. A failure or permission expansion blocks distribution.
