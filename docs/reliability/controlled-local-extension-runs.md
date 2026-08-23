# Controlled local extension run report

Generated: 2026-08-23T19:26:54.258Z

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
| extension/src/service-worker.ts | `2213b19324f4d2271346bfcf19d13f6520820a87c6a00ac77542fe3161d1abbd` |
| extension/src/demo-runner.ts | `8987be2e63f3720b1a5202c0bde521930115deb79c86ac71e78ef4dec0bf9457` |
| extension/src/run-eligibility.ts | `bd8f65e2b6d7c065ead3bc780478b380d4265c546a1e7198b657910060442fb6` |
| extension/controlled-run-harness.js | `871b3f67f8785cef7afc573b741fe3f687c61104ac922efca72231db4dee8f8c` |

## Run ledger

| Run | Workflow version | Result | Pause reason | Started (UTC) | Finished (UTC) |
| ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | completed | — | 2026-08-23T19:26:50.118Z | 2026-08-23T19:26:50.236Z |
| 2 | 1 | completed | — | 2026-08-23T19:26:50.237Z | 2026-08-23T19:26:50.350Z |
| 3 | 1 | completed | — | 2026-08-23T19:26:50.350Z | 2026-08-23T19:26:50.449Z |
| 4 | 1 | completed | — | 2026-08-23T19:26:50.449Z | 2026-08-23T19:26:50.548Z |
| 5 | 1 | completed | — | 2026-08-23T19:26:50.549Z | 2026-08-23T19:26:50.644Z |
| 6 | 1 | completed | — | 2026-08-23T19:26:50.644Z | 2026-08-23T19:26:50.744Z |
| 7 | 1 | completed | — | 2026-08-23T19:26:50.744Z | 2026-08-23T19:26:50.852Z |
| 8 | 1 | completed | — | 2026-08-23T19:26:50.852Z | 2026-08-23T19:26:50.961Z |
| 9 | 1 | completed | — | 2026-08-23T19:26:50.961Z | 2026-08-23T19:26:51.055Z |
| 10 | 1 | completed | — | 2026-08-23T19:26:51.055Z | 2026-08-23T19:26:51.162Z |
| 11 | 1 | completed | — | 2026-08-23T19:26:51.163Z | 2026-08-23T19:26:51.257Z |
| 12 | 1 | completed | — | 2026-08-23T19:26:51.257Z | 2026-08-23T19:26:51.355Z |
| 13 | 1 | completed | — | 2026-08-23T19:26:51.355Z | 2026-08-23T19:26:51.452Z |
| 14 | 1 | completed | — | 2026-08-23T19:26:51.452Z | 2026-08-23T19:26:51.561Z |
| 15 | 1 | completed | — | 2026-08-23T19:26:51.561Z | 2026-08-23T19:26:51.664Z |
| 16 | 1 | completed | — | 2026-08-23T19:26:51.664Z | 2026-08-23T19:26:51.757Z |
| 17 | 1 | completed | — | 2026-08-23T19:26:51.757Z | 2026-08-23T19:26:51.866Z |
| 18 | 1 | completed | — | 2026-08-23T19:26:51.866Z | 2026-08-23T19:26:51.960Z |
| 19 | 1 | completed | — | 2026-08-23T19:26:51.960Z | 2026-08-23T19:26:52.070Z |
| 20 | 1 | completed | — | 2026-08-23T19:26:52.070Z | 2026-08-23T19:26:52.174Z |
| 21 | 1 | completed | — | 2026-08-23T19:26:52.174Z | 2026-08-23T19:26:52.272Z |
| 22 | 1 | completed | — | 2026-08-23T19:26:52.272Z | 2026-08-23T19:26:52.375Z |
| 23 | 1 | completed | — | 2026-08-23T19:26:52.375Z | 2026-08-23T19:26:52.476Z |
| 24 | 1 | completed | — | 2026-08-23T19:26:52.476Z | 2026-08-23T19:26:52.571Z |
| 25 | 1 | completed | — | 2026-08-23T19:26:52.571Z | 2026-08-23T19:26:52.679Z |
| 26 | 1 | completed | — | 2026-08-23T19:26:52.679Z | 2026-08-23T19:26:52.785Z |
| 27 | 1 | completed | — | 2026-08-23T19:26:52.785Z | 2026-08-23T19:26:52.882Z |
| 28 | 1 | completed | — | 2026-08-23T19:26:52.882Z | 2026-08-23T19:26:52.976Z |
| 29 | 1 | completed | — | 2026-08-23T19:26:52.976Z | 2026-08-23T19:26:53.070Z |
| 30 | 1 | completed | — | 2026-08-23T19:26:53.070Z | 2026-08-23T19:26:53.182Z |
| 31 | 1 | paused | changed-page | 2026-08-23T19:26:53.182Z | 2026-08-23T19:26:53.218Z |
| 32 | 1 | paused | changed-page | 2026-08-23T19:26:53.218Z | 2026-08-23T19:26:53.248Z |
| 33 | 1 | paused | changed-page | 2026-08-23T19:26:53.248Z | 2026-08-23T19:26:53.278Z |
| 34 | 1 | paused | changed-page | 2026-08-23T19:26:53.279Z | 2026-08-23T19:26:53.309Z |
| 35 | 1 | paused | changed-page | 2026-08-23T19:26:53.309Z | 2026-08-23T19:26:53.338Z |
| 36 | 1 | paused | changed-page | 2026-08-23T19:26:53.338Z | 2026-08-23T19:26:53.366Z |
| 37 | 1 | paused | changed-page | 2026-08-23T19:26:53.366Z | 2026-08-23T19:26:53.407Z |
| 38 | 1 | paused | changed-page | 2026-08-23T19:26:53.407Z | 2026-08-23T19:26:53.440Z |
| 39 | 1 | paused | changed-page | 2026-08-23T19:26:53.440Z | 2026-08-23T19:26:53.493Z |
| 40 | 1 | paused | changed-page | 2026-08-23T19:26:53.493Z | 2026-08-23T19:26:53.528Z |
| 41 | 1 | paused | slow-network | 2026-08-23T19:26:53.528Z | 2026-08-23T19:26:53.650Z |
| 42 | 1 | paused | slow-network | 2026-08-23T19:26:53.650Z | 2026-08-23T19:26:53.762Z |
| 43 | 1 | paused | slow-network | 2026-08-23T19:26:53.763Z | 2026-08-23T19:26:53.882Z |
| 44 | 1 | paused | slow-network | 2026-08-23T19:26:53.882Z | 2026-08-23T19:26:53.990Z |
| 45 | 1 | paused | slow-network | 2026-08-23T19:26:53.990Z | 2026-08-23T19:26:54.096Z |
| 46 | 1 | paused | unknown | 2026-08-23T19:26:54.096Z | 2026-08-23T19:26:54.128Z |
| 47 | 1 | paused | unknown | 2026-08-23T19:26:54.128Z | 2026-08-23T19:26:54.158Z |
| 48 | 1 | paused | unknown | 2026-08-23T19:26:54.158Z | 2026-08-23T19:26:54.192Z |
| 49 | 1 | paused | unknown | 2026-08-23T19:26:54.193Z | 2026-08-23T19:26:54.226Z |
| 50 | 1 | paused | unknown | 2026-08-23T19:26:54.226Z | 2026-08-23T19:26:54.258Z |
