# Phase 0 baseline

**Recorded:** 2026-08-09  
**Frontend commit before Phase 0:** `9ff60e9`

## Verified commands

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test:extension` — 14 tests passed, including the controlled-run evidence matrix.
- `npm run verify:controlled-runs` — generated evidence verified.
- `npm run build` — passed with nine statically generated Next.js routes.

## Reference workflow

The local report-download fixture remains the vertical slice used to prove recording, compilation, editing, execution, verification, versioning, and repair as later phases are implemented.

## Known boundary

The current extension records bounded summaries and can run only the explicit local report fixture. General capture-to-workflow compilation and arbitrary WorkflowSpec execution are not yet implemented.
