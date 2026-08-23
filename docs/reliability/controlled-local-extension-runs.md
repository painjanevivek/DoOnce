# Controlled local extension run report

Generated: 2026-08-23T19:54:14.444Z

This is automated, controlled local evidence—not 50 manual user runs or a production/pilot reliability result. It exercises the shipped extension service worker, run policy, and demo runner with explicit approval required for every run.

| Metric | Result |
| --- | ---: |
| Run count | 50 |
| Completed | 30 |
| Paused | 20 |
| Workflow version | 1 |

## Pause reasons

| Reason | Count |
| --- | ---: |
| Changed page | 10 |
| Slow network | 5 |
| Unknown / message-channel failure | 5 |

The workflow version is the controlled local fixture configuration. Extension receipts deliberately omit workflow identifiers, origins, element selectors, values, and receipt IDs.

## Evidence binding

CI replays the service worker, run policy, and content runner for the same 50-run matrix. It also rejects this ledger if any source digest below changes. This proves the controlled code path and binds the ledger to that exact source; it does not claim to prove a production or pilot run.

| Source | SHA-256 |
| --- | --- |
| extension/src/service-worker.ts | `519a0e43b253a0fbc620edb5d3964ab011eb59b67b2e71e862a6acc5ed68cc05` |
| extension/src/demo-runner.ts | `8987be2e63f3720b1a5202c0bde521930115deb79c86ac71e78ef4dec0bf9457` |
| extension/src/run-eligibility.ts | `bd8f65e2b6d7c065ead3bc780478b380d4265c546a1e7198b657910060442fb6` |
| extension/controlled-run-harness.js | `871b3f67f8785cef7afc573b741fe3f687c61104ac922efca72231db4dee8f8c` |

## Run ledger

| Run | Workflow version | Result | Pause reason | Started (UTC) | Finished (UTC) |
| ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | completed | — | 2026-08-23T19:54:10.219Z | 2026-08-23T19:54:10.346Z |
| 2 | 1 | completed | — | 2026-08-23T19:54:10.346Z | 2026-08-23T19:54:10.461Z |
| 3 | 1 | completed | — | 2026-08-23T19:54:10.461Z | 2026-08-23T19:54:10.561Z |
| 4 | 1 | completed | — | 2026-08-23T19:54:10.561Z | 2026-08-23T19:54:10.670Z |
| 5 | 1 | completed | — | 2026-08-23T19:54:10.670Z | 2026-08-23T19:54:10.771Z |
| 6 | 1 | completed | — | 2026-08-23T19:54:10.771Z | 2026-08-23T19:54:10.870Z |
| 7 | 1 | completed | — | 2026-08-23T19:54:10.870Z | 2026-08-23T19:54:10.983Z |
| 8 | 1 | completed | — | 2026-08-23T19:54:10.983Z | 2026-08-23T19:54:11.093Z |
| 9 | 1 | completed | — | 2026-08-23T19:54:11.093Z | 2026-08-23T19:54:11.195Z |
| 10 | 1 | completed | — | 2026-08-23T19:54:11.195Z | 2026-08-23T19:54:11.300Z |
| 11 | 1 | completed | — | 2026-08-23T19:54:11.300Z | 2026-08-23T19:54:11.399Z |
| 12 | 1 | completed | — | 2026-08-23T19:54:11.399Z | 2026-08-23T19:54:11.499Z |
| 13 | 1 | completed | — | 2026-08-23T19:54:11.499Z | 2026-08-23T19:54:11.600Z |
| 14 | 1 | completed | — | 2026-08-23T19:54:11.600Z | 2026-08-23T19:54:11.699Z |
| 15 | 1 | completed | — | 2026-08-23T19:54:11.699Z | 2026-08-23T19:54:11.804Z |
| 16 | 1 | completed | — | 2026-08-23T19:54:11.805Z | 2026-08-23T19:54:11.913Z |
| 17 | 1 | completed | — | 2026-08-23T19:54:11.913Z | 2026-08-23T19:54:12.015Z |
| 18 | 1 | completed | — | 2026-08-23T19:54:12.016Z | 2026-08-23T19:54:12.113Z |
| 19 | 1 | completed | — | 2026-08-23T19:54:12.113Z | 2026-08-23T19:54:12.220Z |
| 20 | 1 | completed | — | 2026-08-23T19:54:12.220Z | 2026-08-23T19:54:12.328Z |
| 21 | 1 | completed | — | 2026-08-23T19:54:12.328Z | 2026-08-23T19:54:12.433Z |
| 22 | 1 | completed | — | 2026-08-23T19:54:12.433Z | 2026-08-23T19:54:12.532Z |
| 23 | 1 | completed | — | 2026-08-23T19:54:12.532Z | 2026-08-23T19:54:12.631Z |
| 24 | 1 | completed | — | 2026-08-23T19:54:12.632Z | 2026-08-23T19:54:12.728Z |
| 25 | 1 | completed | — | 2026-08-23T19:54:12.728Z | 2026-08-23T19:54:12.829Z |
| 26 | 1 | completed | — | 2026-08-23T19:54:12.829Z | 2026-08-23T19:54:12.928Z |
| 27 | 1 | completed | — | 2026-08-23T19:54:12.928Z | 2026-08-23T19:54:13.028Z |
| 28 | 1 | completed | — | 2026-08-23T19:54:13.028Z | 2026-08-23T19:54:13.124Z |
| 29 | 1 | completed | — | 2026-08-23T19:54:13.124Z | 2026-08-23T19:54:13.220Z |
| 30 | 1 | completed | — | 2026-08-23T19:54:13.220Z | 2026-08-23T19:54:13.316Z |
| 31 | 1 | paused | changed-page | 2026-08-23T19:54:13.316Z | 2026-08-23T19:54:13.337Z |
| 32 | 1 | paused | changed-page | 2026-08-23T19:54:13.337Z | 2026-08-23T19:54:13.362Z |
| 33 | 1 | paused | changed-page | 2026-08-23T19:54:13.362Z | 2026-08-23T19:54:13.382Z |
| 34 | 1 | paused | changed-page | 2026-08-23T19:54:13.382Z | 2026-08-23T19:54:13.405Z |
| 35 | 1 | paused | changed-page | 2026-08-23T19:54:13.405Z | 2026-08-23T19:54:13.429Z |
| 36 | 1 | paused | changed-page | 2026-08-23T19:54:13.429Z | 2026-08-23T19:54:13.451Z |
| 37 | 1 | paused | changed-page | 2026-08-23T19:54:13.451Z | 2026-08-23T19:54:13.477Z |
| 38 | 1 | paused | changed-page | 2026-08-23T19:54:13.477Z | 2026-08-23T19:54:13.498Z |
| 39 | 1 | paused | changed-page | 2026-08-23T19:54:13.498Z | 2026-08-23T19:54:13.522Z |
| 40 | 1 | paused | changed-page | 2026-08-23T19:54:13.522Z | 2026-08-23T19:54:13.556Z |
| 41 | 1 | paused | slow-network | 2026-08-23T19:54:13.556Z | 2026-08-23T19:54:13.657Z |
| 42 | 1 | paused | slow-network | 2026-08-23T19:54:13.657Z | 2026-08-23T19:54:13.757Z |
| 43 | 1 | paused | slow-network | 2026-08-23T19:54:13.757Z | 2026-08-23T19:54:13.913Z |
| 44 | 1 | paused | slow-network | 2026-08-23T19:54:13.913Z | 2026-08-23T19:54:14.025Z |
| 45 | 1 | paused | slow-network | 2026-08-23T19:54:14.025Z | 2026-08-23T19:54:14.146Z |
| 46 | 1 | paused | unknown | 2026-08-23T19:54:14.146Z | 2026-08-23T19:54:14.202Z |
| 47 | 1 | paused | unknown | 2026-08-23T19:54:14.202Z | 2026-08-23T19:54:14.265Z |
| 48 | 1 | paused | unknown | 2026-08-23T19:54:14.265Z | 2026-08-23T19:54:14.326Z |
| 49 | 1 | paused | unknown | 2026-08-23T19:54:14.326Z | 2026-08-23T19:54:14.377Z |
| 50 | 1 | paused | unknown | 2026-08-23T19:54:14.377Z | 2026-08-23T19:54:14.444Z |
