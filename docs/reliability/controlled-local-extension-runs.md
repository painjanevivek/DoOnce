# Controlled local extension run report

Generated: 2026-08-08T23:06:45.086Z

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
| extension/src/service-worker.ts | `bce023f317b408d0e3364a4917ec9931bc59127c02d46f3800c226dfcb8a047b` |
| extension/src/demo-runner.ts | `8987be2e63f3720b1a5202c0bde521930115deb79c86ac71e78ef4dec0bf9457` |
| extension/src/run-eligibility.ts | `bd8f65e2b6d7c065ead3bc780478b380d4265c546a1e7198b657910060442fb6` |
| extension/controlled-run-harness.js | `55fc35bc01dd62d0a7cf8c5f6f33dc4767f89bf3cbdbef0d84ec3c5d55aeca31` |

## Run ledger

| Run | Workflow version | Result | Pause reason | Started (UTC) | Finished (UTC) |
| ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | completed | — | 2026-08-08T23:06:42.214Z | 2026-08-08T23:06:42.292Z |
| 2 | 1 | completed | — | 2026-08-08T23:06:42.292Z | 2026-08-08T23:06:42.375Z |
| 3 | 1 | completed | — | 2026-08-08T23:06:42.375Z | 2026-08-08T23:06:42.454Z |
| 4 | 1 | completed | — | 2026-08-08T23:06:42.454Z | 2026-08-08T23:06:42.533Z |
| 5 | 1 | completed | — | 2026-08-08T23:06:42.533Z | 2026-08-08T23:06:42.611Z |
| 6 | 1 | completed | — | 2026-08-08T23:06:42.611Z | 2026-08-08T23:06:42.687Z |
| 7 | 1 | completed | — | 2026-08-08T23:06:42.688Z | 2026-08-08T23:06:42.769Z |
| 8 | 1 | completed | — | 2026-08-08T23:06:42.769Z | 2026-08-08T23:06:42.846Z |
| 9 | 1 | completed | — | 2026-08-08T23:06:42.846Z | 2026-08-08T23:06:42.923Z |
| 10 | 1 | completed | — | 2026-08-08T23:06:42.923Z | 2026-08-08T23:06:43.010Z |
| 11 | 1 | completed | — | 2026-08-08T23:06:43.011Z | 2026-08-08T23:06:43.088Z |
| 12 | 1 | completed | — | 2026-08-08T23:06:43.088Z | 2026-08-08T23:06:43.171Z |
| 13 | 1 | completed | — | 2026-08-08T23:06:43.172Z | 2026-08-08T23:06:43.256Z |
| 14 | 1 | completed | — | 2026-08-08T23:06:43.256Z | 2026-08-08T23:06:43.342Z |
| 15 | 1 | completed | — | 2026-08-08T23:06:43.342Z | 2026-08-08T23:06:43.423Z |
| 16 | 1 | completed | — | 2026-08-08T23:06:43.423Z | 2026-08-08T23:06:43.502Z |
| 17 | 1 | completed | — | 2026-08-08T23:06:43.502Z | 2026-08-08T23:06:43.585Z |
| 18 | 1 | completed | — | 2026-08-08T23:06:43.586Z | 2026-08-08T23:06:43.665Z |
| 19 | 1 | completed | — | 2026-08-08T23:06:43.665Z | 2026-08-08T23:06:43.742Z |
| 20 | 1 | completed | — | 2026-08-08T23:06:43.742Z | 2026-08-08T23:06:43.825Z |
| 21 | 1 | completed | — | 2026-08-08T23:06:43.825Z | 2026-08-08T23:06:43.915Z |
| 22 | 1 | completed | — | 2026-08-08T23:06:43.915Z | 2026-08-08T23:06:44.005Z |
| 23 | 1 | completed | — | 2026-08-08T23:06:44.005Z | 2026-08-08T23:06:44.081Z |
| 24 | 1 | completed | — | 2026-08-08T23:06:44.081Z | 2026-08-08T23:06:44.161Z |
| 25 | 1 | completed | — | 2026-08-08T23:06:44.161Z | 2026-08-08T23:06:44.244Z |
| 26 | 1 | completed | — | 2026-08-08T23:06:44.244Z | 2026-08-08T23:06:44.327Z |
| 27 | 1 | completed | — | 2026-08-08T23:06:44.327Z | 2026-08-08T23:06:44.415Z |
| 28 | 1 | completed | — | 2026-08-08T23:06:44.415Z | 2026-08-08T23:06:44.498Z |
| 29 | 1 | completed | — | 2026-08-08T23:06:44.498Z | 2026-08-08T23:06:44.581Z |
| 30 | 1 | completed | — | 2026-08-08T23:06:44.581Z | 2026-08-08T23:06:44.661Z |
| 31 | 1 | paused | changed-page | 2026-08-08T23:06:44.661Z | 2026-08-08T23:06:44.662Z |
| 32 | 1 | paused | changed-page | 2026-08-08T23:06:44.662Z | 2026-08-08T23:06:44.663Z |
| 33 | 1 | paused | changed-page | 2026-08-08T23:06:44.663Z | 2026-08-08T23:06:44.663Z |
| 34 | 1 | paused | changed-page | 2026-08-08T23:06:44.664Z | 2026-08-08T23:06:44.664Z |
| 35 | 1 | paused | changed-page | 2026-08-08T23:06:44.664Z | 2026-08-08T23:06:44.665Z |
| 36 | 1 | paused | changed-page | 2026-08-08T23:06:44.665Z | 2026-08-08T23:06:44.666Z |
| 37 | 1 | paused | changed-page | 2026-08-08T23:06:44.666Z | 2026-08-08T23:06:44.667Z |
| 38 | 1 | paused | changed-page | 2026-08-08T23:06:44.667Z | 2026-08-08T23:06:44.668Z |
| 39 | 1 | paused | changed-page | 2026-08-08T23:06:44.668Z | 2026-08-08T23:06:44.669Z |
| 40 | 1 | paused | changed-page | 2026-08-08T23:06:44.669Z | 2026-08-08T23:06:44.670Z |
| 41 | 1 | paused | slow-network | 2026-08-08T23:06:44.670Z | 2026-08-08T23:06:44.752Z |
| 42 | 1 | paused | slow-network | 2026-08-08T23:06:44.752Z | 2026-08-08T23:06:44.831Z |
| 43 | 1 | paused | slow-network | 2026-08-08T23:06:44.831Z | 2026-08-08T23:06:44.914Z |
| 44 | 1 | paused | slow-network | 2026-08-08T23:06:44.914Z | 2026-08-08T23:06:45.002Z |
| 45 | 1 | paused | slow-network | 2026-08-08T23:06:45.002Z | 2026-08-08T23:06:45.081Z |
| 46 | 1 | paused | unknown | 2026-08-08T23:06:45.081Z | 2026-08-08T23:06:45.083Z |
| 47 | 1 | paused | unknown | 2026-08-08T23:06:45.083Z | 2026-08-08T23:06:45.084Z |
| 48 | 1 | paused | unknown | 2026-08-08T23:06:45.084Z | 2026-08-08T23:06:45.084Z |
| 49 | 1 | paused | unknown | 2026-08-08T23:06:45.084Z | 2026-08-08T23:06:45.085Z |
| 50 | 1 | paused | unknown | 2026-08-08T23:06:45.085Z | 2026-08-08T23:06:45.086Z |
