# Phase 1 terminology and capture migration

The dashboard and extension now present DoOnce as a browser workflow product. Functional validation, explicit site approval, protected-field exclusion, and deterministic pause behavior remain in place.

| Deprecated surface | Current surface | Compatibility behavior |
| --- | --- | --- |
| `SafeCaptureSummary` | `RecordedActionSummary` | New TypeScript name only. |
| `doonce.safe-capture.v1` | `doonce.capture.v2` | v1 remains readable; all new extension exports write v2. |
| `createSafeDraft` | `createDraftFromCapture` | Internal dashboard rename. |
| `safePath` | `normalizeRecordedPath` | Internal extension rename. |
| `safeSelector` | `buildLocatorCandidate` | Internal extension rename. |
| `capture-policy` | `capture-eligibility` | The old browser runtime file is replaced by the TypeScript module. |
| `run-policy` | `run-eligibility` | The old browser runtime file is replaced by the TypeScript module. |
| `Safe Capture extension alpha` | `DoOnce Browser Automation Extension` | Manifest, popup, and documentation use the current name. |

Legacy imports with no path are normalized to `/` and remain review-only. They cannot become the supported local report workflow without an explicit `/demo/reports` path.
