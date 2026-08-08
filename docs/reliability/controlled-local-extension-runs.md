# Controlled local extension run report

Generated: 2026-08-08T22:42:24.644Z

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
| extension/service-worker.js | `388fb88718fa916e364f7f2b3316129659c0dd15e1ccd71a385b052aefba2c1c` |
| extension/demo-runner.js | `b5dce309755f047367ca55dab0461bea17cd4f4fc8a2098d43f2b086c5aaf07f` |
| extension/run-policy.js | `e11fc8e2985d110edb3515c8462e72c61a54421491bd9caa40a80cc5b54a7222` |
| extension/controlled-run-harness.js | `9ffc4c6f9fb48ed3b1aa466866549a3d5c7d3842b8e4d32930fc74f5f3e00f08` |

## Run ledger

| Run | Workflow version | Result | Pause reason | Started (UTC) | Finished (UTC) |
| ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | completed | — | 2026-08-08T22:42:21.766Z | 2026-08-08T22:42:21.856Z |
| 2 | 1 | completed | — | 2026-08-08T22:42:21.856Z | 2026-08-08T22:42:21.934Z |
| 3 | 1 | completed | — | 2026-08-08T22:42:21.935Z | 2026-08-08T22:42:22.022Z |
| 4 | 1 | completed | — | 2026-08-08T22:42:22.022Z | 2026-08-08T22:42:22.102Z |
| 5 | 1 | completed | — | 2026-08-08T22:42:22.102Z | 2026-08-08T22:42:22.185Z |
| 6 | 1 | completed | — | 2026-08-08T22:42:22.185Z | 2026-08-08T22:42:22.265Z |
| 7 | 1 | completed | — | 2026-08-08T22:42:22.265Z | 2026-08-08T22:42:22.343Z |
| 8 | 1 | completed | — | 2026-08-08T22:42:22.343Z | 2026-08-08T22:42:22.426Z |
| 9 | 1 | completed | — | 2026-08-08T22:42:22.426Z | 2026-08-08T22:42:22.510Z |
| 10 | 1 | completed | — | 2026-08-08T22:42:22.510Z | 2026-08-08T22:42:22.589Z |
| 11 | 1 | completed | — | 2026-08-08T22:42:22.589Z | 2026-08-08T22:42:22.668Z |
| 12 | 1 | completed | — | 2026-08-08T22:42:22.668Z | 2026-08-08T22:42:22.758Z |
| 13 | 1 | completed | — | 2026-08-08T22:42:22.758Z | 2026-08-08T22:42:22.843Z |
| 14 | 1 | completed | — | 2026-08-08T22:42:22.843Z | 2026-08-08T22:42:22.927Z |
| 15 | 1 | completed | — | 2026-08-08T22:42:22.927Z | 2026-08-08T22:42:23.006Z |
| 16 | 1 | completed | — | 2026-08-08T22:42:23.006Z | 2026-08-08T22:42:23.089Z |
| 17 | 1 | completed | — | 2026-08-08T22:42:23.089Z | 2026-08-08T22:42:23.168Z |
| 18 | 1 | completed | — | 2026-08-08T22:42:23.168Z | 2026-08-08T22:42:23.247Z |
| 19 | 1 | completed | — | 2026-08-08T22:42:23.247Z | 2026-08-08T22:42:23.334Z |
| 20 | 1 | completed | — | 2026-08-08T22:42:23.334Z | 2026-08-08T22:42:23.410Z |
| 21 | 1 | completed | — | 2026-08-08T22:42:23.410Z | 2026-08-08T22:42:23.497Z |
| 22 | 1 | completed | — | 2026-08-08T22:42:23.497Z | 2026-08-08T22:42:23.576Z |
| 23 | 1 | completed | — | 2026-08-08T22:42:23.576Z | 2026-08-08T22:42:23.652Z |
| 24 | 1 | completed | — | 2026-08-08T22:42:23.652Z | 2026-08-08T22:42:23.734Z |
| 25 | 1 | completed | — | 2026-08-08T22:42:23.735Z | 2026-08-08T22:42:23.822Z |
| 26 | 1 | completed | — | 2026-08-08T22:42:23.822Z | 2026-08-08T22:42:23.905Z |
| 27 | 1 | completed | — | 2026-08-08T22:42:23.905Z | 2026-08-08T22:42:23.983Z |
| 28 | 1 | completed | — | 2026-08-08T22:42:23.983Z | 2026-08-08T22:42:24.060Z |
| 29 | 1 | completed | — | 2026-08-08T22:42:24.060Z | 2026-08-08T22:42:24.139Z |
| 30 | 1 | completed | — | 2026-08-08T22:42:24.139Z | 2026-08-08T22:42:24.224Z |
| 31 | 1 | paused | changed-page | 2026-08-08T22:42:24.224Z | 2026-08-08T22:42:24.225Z |
| 32 | 1 | paused | changed-page | 2026-08-08T22:42:24.225Z | 2026-08-08T22:42:24.226Z |
| 33 | 1 | paused | changed-page | 2026-08-08T22:42:24.226Z | 2026-08-08T22:42:24.227Z |
| 34 | 1 | paused | changed-page | 2026-08-08T22:42:24.227Z | 2026-08-08T22:42:24.228Z |
| 35 | 1 | paused | changed-page | 2026-08-08T22:42:24.228Z | 2026-08-08T22:42:24.229Z |
| 36 | 1 | paused | changed-page | 2026-08-08T22:42:24.229Z | 2026-08-08T22:42:24.231Z |
| 37 | 1 | paused | changed-page | 2026-08-08T22:42:24.231Z | 2026-08-08T22:42:24.232Z |
| 38 | 1 | paused | changed-page | 2026-08-08T22:42:24.232Z | 2026-08-08T22:42:24.233Z |
| 39 | 1 | paused | changed-page | 2026-08-08T22:42:24.233Z | 2026-08-08T22:42:24.234Z |
| 40 | 1 | paused | changed-page | 2026-08-08T22:42:24.234Z | 2026-08-08T22:42:24.235Z |
| 41 | 1 | paused | slow-network | 2026-08-08T22:42:24.235Z | 2026-08-08T22:42:24.319Z |
| 42 | 1 | paused | slow-network | 2026-08-08T22:42:24.319Z | 2026-08-08T22:42:24.397Z |
| 43 | 1 | paused | slow-network | 2026-08-08T22:42:24.397Z | 2026-08-08T22:42:24.475Z |
| 44 | 1 | paused | slow-network | 2026-08-08T22:42:24.475Z | 2026-08-08T22:42:24.561Z |
| 45 | 1 | paused | slow-network | 2026-08-08T22:42:24.561Z | 2026-08-08T22:42:24.638Z |
| 46 | 1 | paused | unknown | 2026-08-08T22:42:24.639Z | 2026-08-08T22:42:24.640Z |
| 47 | 1 | paused | unknown | 2026-08-08T22:42:24.640Z | 2026-08-08T22:42:24.641Z |
| 48 | 1 | paused | unknown | 2026-08-08T22:42:24.641Z | 2026-08-08T22:42:24.642Z |
| 49 | 1 | paused | unknown | 2026-08-08T22:42:24.642Z | 2026-08-08T22:42:24.643Z |
| 50 | 1 | paused | unknown | 2026-08-08T22:42:24.643Z | 2026-08-08T22:42:24.644Z |
