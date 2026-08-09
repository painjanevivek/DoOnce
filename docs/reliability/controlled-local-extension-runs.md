# Controlled local extension run report

Generated: 2026-08-09T04:39:20.811Z

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
| extension/src/service-worker.ts | `71419ec78912a7e5ce0fb05320af8b100626d7d8527a08686aedc8dbbff5cb57` |
| extension/src/demo-runner.ts | `8987be2e63f3720b1a5202c0bde521930115deb79c86ac71e78ef4dec0bf9457` |
| extension/src/run-eligibility.ts | `bd8f65e2b6d7c065ead3bc780478b380d4265c546a1e7198b657910060442fb6` |
| extension/controlled-run-harness.js | `2e69857e100ab59bd9d3060d8254c62fa47c3a01cca19db4e64bed577275bea1` |

## Run ledger

| Run | Workflow version | Result | Pause reason | Started (UTC) | Finished (UTC) |
| ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | completed | — | 2026-08-09T04:39:17.051Z | 2026-08-09T04:39:17.211Z |
| 2 | 1 | completed | — | 2026-08-09T04:39:17.211Z | 2026-08-09T04:39:17.313Z |
| 3 | 1 | completed | — | 2026-08-09T04:39:17.313Z | 2026-08-09T04:39:17.414Z |
| 4 | 1 | completed | — | 2026-08-09T04:39:17.414Z | 2026-08-09T04:39:17.507Z |
| 5 | 1 | completed | — | 2026-08-09T04:39:17.507Z | 2026-08-09T04:39:17.602Z |
| 6 | 1 | completed | — | 2026-08-09T04:39:17.602Z | 2026-08-09T04:39:17.698Z |
| 7 | 1 | completed | — | 2026-08-09T04:39:17.698Z | 2026-08-09T04:39:17.797Z |
| 8 | 1 | completed | — | 2026-08-09T04:39:17.797Z | 2026-08-09T04:39:17.892Z |
| 9 | 1 | completed | — | 2026-08-09T04:39:17.892Z | 2026-08-09T04:39:18.001Z |
| 10 | 1 | completed | — | 2026-08-09T04:39:18.001Z | 2026-08-09T04:39:18.099Z |
| 11 | 1 | completed | — | 2026-08-09T04:39:18.099Z | 2026-08-09T04:39:18.194Z |
| 12 | 1 | completed | — | 2026-08-09T04:39:18.194Z | 2026-08-09T04:39:18.288Z |
| 13 | 1 | completed | — | 2026-08-09T04:39:18.288Z | 2026-08-09T04:39:18.381Z |
| 14 | 1 | completed | — | 2026-08-09T04:39:18.382Z | 2026-08-09T04:39:18.480Z |
| 15 | 1 | completed | — | 2026-08-09T04:39:18.480Z | 2026-08-09T04:39:18.576Z |
| 16 | 1 | completed | — | 2026-08-09T04:39:18.576Z | 2026-08-09T04:39:18.669Z |
| 17 | 1 | completed | — | 2026-08-09T04:39:18.669Z | 2026-08-09T04:39:18.768Z |
| 18 | 1 | completed | — | 2026-08-09T04:39:18.768Z | 2026-08-09T04:39:18.866Z |
| 19 | 1 | completed | — | 2026-08-09T04:39:18.866Z | 2026-08-09T04:39:18.959Z |
| 20 | 1 | completed | — | 2026-08-09T04:39:18.959Z | 2026-08-09T04:39:19.055Z |
| 21 | 1 | completed | — | 2026-08-09T04:39:19.055Z | 2026-08-09T04:39:19.154Z |
| 22 | 1 | completed | — | 2026-08-09T04:39:19.154Z | 2026-08-09T04:39:19.261Z |
| 23 | 1 | completed | — | 2026-08-09T04:39:19.261Z | 2026-08-09T04:39:19.359Z |
| 24 | 1 | completed | — | 2026-08-09T04:39:19.359Z | 2026-08-09T04:39:19.458Z |
| 25 | 1 | completed | — | 2026-08-09T04:39:19.458Z | 2026-08-09T04:39:19.556Z |
| 26 | 1 | completed | — | 2026-08-09T04:39:19.556Z | 2026-08-09T04:39:19.655Z |
| 27 | 1 | completed | — | 2026-08-09T04:39:19.655Z | 2026-08-09T04:39:19.759Z |
| 28 | 1 | completed | — | 2026-08-09T04:39:19.759Z | 2026-08-09T04:39:19.854Z |
| 29 | 1 | completed | — | 2026-08-09T04:39:19.854Z | 2026-08-09T04:39:19.947Z |
| 30 | 1 | completed | — | 2026-08-09T04:39:19.947Z | 2026-08-09T04:39:20.050Z |
| 31 | 1 | paused | changed-page | 2026-08-09T04:39:20.050Z | 2026-08-09T04:39:20.074Z |
| 32 | 1 | paused | changed-page | 2026-08-09T04:39:20.074Z | 2026-08-09T04:39:20.090Z |
| 33 | 1 | paused | changed-page | 2026-08-09T04:39:20.090Z | 2026-08-09T04:39:20.110Z |
| 34 | 1 | paused | changed-page | 2026-08-09T04:39:20.110Z | 2026-08-09T04:39:20.128Z |
| 35 | 1 | paused | changed-page | 2026-08-09T04:39:20.128Z | 2026-08-09T04:39:20.146Z |
| 36 | 1 | paused | changed-page | 2026-08-09T04:39:20.146Z | 2026-08-09T04:39:20.164Z |
| 37 | 1 | paused | changed-page | 2026-08-09T04:39:20.164Z | 2026-08-09T04:39:20.182Z |
| 38 | 1 | paused | changed-page | 2026-08-09T04:39:20.183Z | 2026-08-09T04:39:20.204Z |
| 39 | 1 | paused | changed-page | 2026-08-09T04:39:20.204Z | 2026-08-09T04:39:20.223Z |
| 40 | 1 | paused | changed-page | 2026-08-09T04:39:20.223Z | 2026-08-09T04:39:20.240Z |
| 41 | 1 | paused | slow-network | 2026-08-09T04:39:20.240Z | 2026-08-09T04:39:20.334Z |
| 42 | 1 | paused | slow-network | 2026-08-09T04:39:20.334Z | 2026-08-09T04:39:20.428Z |
| 43 | 1 | paused | slow-network | 2026-08-09T04:39:20.428Z | 2026-08-09T04:39:20.525Z |
| 44 | 1 | paused | slow-network | 2026-08-09T04:39:20.525Z | 2026-08-09T04:39:20.618Z |
| 45 | 1 | paused | slow-network | 2026-08-09T04:39:20.618Z | 2026-08-09T04:39:20.715Z |
| 46 | 1 | paused | unknown | 2026-08-09T04:39:20.715Z | 2026-08-09T04:39:20.734Z |
| 47 | 1 | paused | unknown | 2026-08-09T04:39:20.734Z | 2026-08-09T04:39:20.755Z |
| 48 | 1 | paused | unknown | 2026-08-09T04:39:20.755Z | 2026-08-09T04:39:20.773Z |
| 49 | 1 | paused | unknown | 2026-08-09T04:39:20.773Z | 2026-08-09T04:39:20.789Z |
| 50 | 1 | paused | unknown | 2026-08-09T04:39:20.789Z | 2026-08-09T04:39:20.811Z |
