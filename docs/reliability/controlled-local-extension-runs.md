# Controlled local extension run report

Generated: 2026-08-08T22:52:37.940Z

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
| extension/service-worker.js | `35ab9a31a0ce2eb21152770c2ecbf50329d0f0e30769e7cd84bc4cb7f2c06159` |
| extension/demo-runner.js | `b5dce309755f047367ca55dab0461bea17cd4f4fc8a2098d43f2b086c5aaf07f` |
| extension/run-policy.js | `e11fc8e2985d110edb3515c8462e72c61a54421491bd9caa40a80cc5b54a7222` |
| extension/controlled-run-harness.js | `9ffc4c6f9fb48ed3b1aa466866549a3d5c7d3842b8e4d32930fc74f5f3e00f08` |

## Run ledger

| Run | Workflow version | Result | Pause reason | Started (UTC) | Finished (UTC) |
| ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | completed | — | 2026-08-08T22:52:35.058Z | 2026-08-08T22:52:35.141Z |
| 2 | 1 | completed | — | 2026-08-08T22:52:35.142Z | 2026-08-08T22:52:35.223Z |
| 3 | 1 | completed | — | 2026-08-08T22:52:35.223Z | 2026-08-08T22:52:35.317Z |
| 4 | 1 | completed | — | 2026-08-08T22:52:35.317Z | 2026-08-08T22:52:35.401Z |
| 5 | 1 | completed | — | 2026-08-08T22:52:35.401Z | 2026-08-08T22:52:35.482Z |
| 6 | 1 | completed | — | 2026-08-08T22:52:35.482Z | 2026-08-08T22:52:35.564Z |
| 7 | 1 | completed | — | 2026-08-08T22:52:35.564Z | 2026-08-08T22:52:35.648Z |
| 8 | 1 | completed | — | 2026-08-08T22:52:35.648Z | 2026-08-08T22:52:35.727Z |
| 9 | 1 | completed | — | 2026-08-08T22:52:35.727Z | 2026-08-08T22:52:35.810Z |
| 10 | 1 | completed | — | 2026-08-08T22:52:35.810Z | 2026-08-08T22:52:35.900Z |
| 11 | 1 | completed | — | 2026-08-08T22:52:35.900Z | 2026-08-08T22:52:35.977Z |
| 12 | 1 | completed | — | 2026-08-08T22:52:35.977Z | 2026-08-08T22:52:36.060Z |
| 13 | 1 | completed | — | 2026-08-08T22:52:36.060Z | 2026-08-08T22:52:36.146Z |
| 14 | 1 | completed | — | 2026-08-08T22:52:36.146Z | 2026-08-08T22:52:36.223Z |
| 15 | 1 | completed | — | 2026-08-08T22:52:36.223Z | 2026-08-08T22:52:36.306Z |
| 16 | 1 | completed | — | 2026-08-08T22:52:36.306Z | 2026-08-08T22:52:36.386Z |
| 17 | 1 | completed | — | 2026-08-08T22:52:36.386Z | 2026-08-08T22:52:36.466Z |
| 18 | 1 | completed | — | 2026-08-08T22:52:36.467Z | 2026-08-08T22:52:36.543Z |
| 19 | 1 | completed | — | 2026-08-08T22:52:36.543Z | 2026-08-08T22:52:36.620Z |
| 20 | 1 | completed | — | 2026-08-08T22:52:36.620Z | 2026-08-08T22:52:36.698Z |
| 21 | 1 | completed | — | 2026-08-08T22:52:36.698Z | 2026-08-08T22:52:36.777Z |
| 22 | 1 | completed | — | 2026-08-08T22:52:36.777Z | 2026-08-08T22:52:36.860Z |
| 23 | 1 | completed | — | 2026-08-08T22:52:36.860Z | 2026-08-08T22:52:36.942Z |
| 24 | 1 | completed | — | 2026-08-08T22:52:36.942Z | 2026-08-08T22:52:37.022Z |
| 25 | 1 | completed | — | 2026-08-08T22:52:37.022Z | 2026-08-08T22:52:37.099Z |
| 26 | 1 | completed | — | 2026-08-08T22:52:37.100Z | 2026-08-08T22:52:37.181Z |
| 27 | 1 | completed | — | 2026-08-08T22:52:37.181Z | 2026-08-08T22:52:37.261Z |
| 28 | 1 | completed | — | 2026-08-08T22:52:37.261Z | 2026-08-08T22:52:37.339Z |
| 29 | 1 | completed | — | 2026-08-08T22:52:37.339Z | 2026-08-08T22:52:37.427Z |
| 30 | 1 | completed | — | 2026-08-08T22:52:37.427Z | 2026-08-08T22:52:37.510Z |
| 31 | 1 | paused | changed-page | 2026-08-08T22:52:37.510Z | 2026-08-08T22:52:37.512Z |
| 32 | 1 | paused | changed-page | 2026-08-08T22:52:37.512Z | 2026-08-08T22:52:37.513Z |
| 33 | 1 | paused | changed-page | 2026-08-08T22:52:37.513Z | 2026-08-08T22:52:37.514Z |
| 34 | 1 | paused | changed-page | 2026-08-08T22:52:37.514Z | 2026-08-08T22:52:37.515Z |
| 35 | 1 | paused | changed-page | 2026-08-08T22:52:37.515Z | 2026-08-08T22:52:37.516Z |
| 36 | 1 | paused | changed-page | 2026-08-08T22:52:37.516Z | 2026-08-08T22:52:37.518Z |
| 37 | 1 | paused | changed-page | 2026-08-08T22:52:37.518Z | 2026-08-08T22:52:37.519Z |
| 38 | 1 | paused | changed-page | 2026-08-08T22:52:37.519Z | 2026-08-08T22:52:37.520Z |
| 39 | 1 | paused | changed-page | 2026-08-08T22:52:37.520Z | 2026-08-08T22:52:37.521Z |
| 40 | 1 | paused | changed-page | 2026-08-08T22:52:37.521Z | 2026-08-08T22:52:37.521Z |
| 41 | 1 | paused | slow-network | 2026-08-08T22:52:37.521Z | 2026-08-08T22:52:37.598Z |
| 42 | 1 | paused | slow-network | 2026-08-08T22:52:37.598Z | 2026-08-08T22:52:37.679Z |
| 43 | 1 | paused | slow-network | 2026-08-08T22:52:37.679Z | 2026-08-08T22:52:37.761Z |
| 44 | 1 | paused | slow-network | 2026-08-08T22:52:37.761Z | 2026-08-08T22:52:37.850Z |
| 45 | 1 | paused | slow-network | 2026-08-08T22:52:37.850Z | 2026-08-08T22:52:37.935Z |
| 46 | 1 | paused | unknown | 2026-08-08T22:52:37.935Z | 2026-08-08T22:52:37.936Z |
| 47 | 1 | paused | unknown | 2026-08-08T22:52:37.936Z | 2026-08-08T22:52:37.937Z |
| 48 | 1 | paused | unknown | 2026-08-08T22:52:37.937Z | 2026-08-08T22:52:37.938Z |
| 49 | 1 | paused | unknown | 2026-08-08T22:52:37.938Z | 2026-08-08T22:52:37.939Z |
| 50 | 1 | paused | unknown | 2026-08-08T22:52:37.939Z | 2026-08-08T22:52:37.940Z |
