# Controlled local extension run report

Generated: 2026-08-24T11:27:53.978Z

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
| extension/src/service-worker.ts | `a767dc876ae7f5adac62198e4b927a66ff9e329afcd8bbd4a03386a22d73b7eb` |
| extension/src/demo-runner.ts | `8987be2e63f3720b1a5202c0bde521930115deb79c86ac71e78ef4dec0bf9457` |
| extension/src/run-eligibility.ts | `bd8f65e2b6d7c065ead3bc780478b380d4265c546a1e7198b657910060442fb6` |
| extension/controlled-run-harness.js | `871b3f67f8785cef7afc573b741fe3f687c61104ac922efca72231db4dee8f8c` |

## Run ledger

| Run | Workflow version | Result | Pause reason | Started (UTC) | Finished (UTC) |
| ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | completed | — | 2026-08-24T11:27:47.712Z | 2026-08-24T11:27:47.971Z |
| 2 | 1 | completed | — | 2026-08-24T11:27:47.971Z | 2026-08-24T11:27:48.096Z |
| 3 | 1 | completed | — | 2026-08-24T11:27:48.097Z | 2026-08-24T11:27:48.219Z |
| 4 | 1 | completed | — | 2026-08-24T11:27:48.219Z | 2026-08-24T11:27:48.340Z |
| 5 | 1 | completed | — | 2026-08-24T11:27:48.340Z | 2026-08-24T11:27:48.450Z |
| 6 | 1 | completed | — | 2026-08-24T11:27:48.450Z | 2026-08-24T11:27:48.562Z |
| 7 | 1 | completed | — | 2026-08-24T11:27:48.562Z | 2026-08-24T11:27:48.679Z |
| 8 | 1 | completed | — | 2026-08-24T11:27:48.679Z | 2026-08-24T11:27:48.790Z |
| 9 | 1 | completed | — | 2026-08-24T11:27:48.790Z | 2026-08-24T11:27:48.884Z |
| 10 | 1 | completed | — | 2026-08-24T11:27:48.884Z | 2026-08-24T11:27:48.992Z |
| 11 | 1 | completed | — | 2026-08-24T11:27:48.993Z | 2026-08-24T11:27:49.111Z |
| 12 | 1 | completed | — | 2026-08-24T11:27:49.112Z | 2026-08-24T11:27:49.232Z |
| 13 | 1 | completed | — | 2026-08-24T11:27:49.233Z | 2026-08-24T11:27:49.358Z |
| 14 | 1 | completed | — | 2026-08-24T11:27:49.358Z | 2026-08-24T11:27:49.457Z |
| 15 | 1 | completed | — | 2026-08-24T11:27:49.457Z | 2026-08-24T11:27:49.571Z |
| 16 | 1 | completed | — | 2026-08-24T11:27:49.571Z | 2026-08-24T11:27:49.681Z |
| 17 | 1 | completed | — | 2026-08-24T11:27:49.681Z | 2026-08-24T11:27:49.792Z |
| 18 | 1 | completed | — | 2026-08-24T11:27:49.792Z | 2026-08-24T11:27:49.907Z |
| 19 | 1 | completed | — | 2026-08-24T11:27:49.908Z | 2026-08-24T11:27:50.026Z |
| 20 | 1 | completed | — | 2026-08-24T11:27:50.026Z | 2026-08-24T11:27:50.140Z |
| 21 | 1 | completed | — | 2026-08-24T11:27:50.140Z | 2026-08-24T11:27:50.257Z |
| 22 | 1 | completed | — | 2026-08-24T11:27:50.258Z | 2026-08-24T11:27:50.368Z |
| 23 | 1 | completed | — | 2026-08-24T11:27:50.369Z | 2026-08-24T11:27:50.484Z |
| 24 | 1 | completed | — | 2026-08-24T11:27:50.484Z | 2026-08-24T11:27:50.596Z |
| 25 | 1 | completed | — | 2026-08-24T11:27:50.596Z | 2026-08-24T11:27:50.722Z |
| 26 | 1 | completed | — | 2026-08-24T11:27:50.722Z | 2026-08-24T11:27:50.912Z |
| 27 | 1 | completed | — | 2026-08-24T11:27:50.912Z | 2026-08-24T11:27:51.095Z |
| 28 | 1 | completed | — | 2026-08-24T11:27:51.095Z | 2026-08-24T11:27:51.275Z |
| 29 | 1 | completed | — | 2026-08-24T11:27:51.275Z | 2026-08-24T11:27:51.457Z |
| 30 | 1 | completed | — | 2026-08-24T11:27:51.457Z | 2026-08-24T11:27:51.632Z |
| 31 | 1 | paused | changed-page | 2026-08-24T11:27:51.632Z | 2026-08-24T11:27:51.723Z |
| 32 | 1 | paused | changed-page | 2026-08-24T11:27:51.723Z | 2026-08-24T11:27:51.813Z |
| 33 | 1 | paused | changed-page | 2026-08-24T11:27:51.813Z | 2026-08-24T11:27:51.903Z |
| 34 | 1 | paused | changed-page | 2026-08-24T11:27:51.903Z | 2026-08-24T11:27:51.984Z |
| 35 | 1 | paused | changed-page | 2026-08-24T11:27:51.984Z | 2026-08-24T11:27:52.091Z |
| 36 | 1 | paused | changed-page | 2026-08-24T11:27:52.091Z | 2026-08-24T11:27:52.201Z |
| 37 | 1 | paused | changed-page | 2026-08-24T11:27:52.201Z | 2026-08-24T11:27:52.317Z |
| 38 | 1 | paused | changed-page | 2026-08-24T11:27:52.317Z | 2026-08-24T11:27:52.428Z |
| 39 | 1 | paused | changed-page | 2026-08-24T11:27:52.429Z | 2026-08-24T11:27:52.534Z |
| 40 | 1 | paused | changed-page | 2026-08-24T11:27:52.534Z | 2026-08-24T11:27:52.635Z |
| 41 | 1 | paused | slow-network | 2026-08-24T11:27:52.636Z | 2026-08-24T11:27:52.825Z |
| 42 | 1 | paused | slow-network | 2026-08-24T11:27:52.825Z | 2026-08-24T11:27:53.007Z |
| 43 | 1 | paused | slow-network | 2026-08-24T11:27:53.007Z | 2026-08-24T11:27:53.182Z |
| 44 | 1 | paused | slow-network | 2026-08-24T11:27:53.182Z | 2026-08-24T11:27:53.365Z |
| 45 | 1 | paused | slow-network | 2026-08-24T11:27:53.365Z | 2026-08-24T11:27:53.524Z |
| 46 | 1 | paused | unknown | 2026-08-24T11:27:53.524Z | 2026-08-24T11:27:53.574Z |
| 47 | 1 | paused | unknown | 2026-08-24T11:27:53.574Z | 2026-08-24T11:27:53.673Z |
| 48 | 1 | paused | unknown | 2026-08-24T11:27:53.673Z | 2026-08-24T11:27:53.771Z |
| 49 | 1 | paused | unknown | 2026-08-24T11:27:53.772Z | 2026-08-24T11:27:53.875Z |
| 50 | 1 | paused | unknown | 2026-08-24T11:27:53.875Z | 2026-08-24T11:27:53.978Z |
