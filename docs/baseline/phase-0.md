# Phase 0 baseline

**Recorded:** 2026-08-24
**Baseline branch:** `feat/product-implementation`

## Verified commands

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run test:extension` — 73 tests passed, plus the controlled-run harness.
- `npm run verify:controlled-runs` — generated evidence verified.
- `npm run build` — passed with nine statically generated Next.js routes.

## Reference workflow

The local report-download fixture remains the vertical slice used to prove recording, compilation, editing, execution, verification, versioning, and repair as later phases are implemented.

## Known boundary

The dashboard and extension now contain broader authoring and execution foundations, while controlled proof remains limited to the report fixture. The [capability matrix](../capability-matrix.md) is authoritative and deliberately separates implementation from deployment and customer proof.
