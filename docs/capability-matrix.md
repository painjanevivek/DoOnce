# DoOnce capability matrix

**Matrix revision:** 2026-08-24
**Release posture:** advanced alpha; controlled external use remains gated

The UI must distinguish availability from proof. “Implemented” means code exists, “tested” means automated repository evidence exists, “deployed” requires a production-like release, and “customer-proven” requires repeated real-user outcomes.

| Product surface | Implemented | Tested | Deployed | Customer-proven | User-facing posture |
|---|---:|---:|---:|---:|---|
| Guided public site | Yes | Yes | No | No | Explain the product model |
| Extension install destination | Conditional | Yes | No | No | Show unavailable until configured |
| Account recovery states | Yes | Yes | No | No | Preserve explicit retry |
| Workflow library and studio | Yes | Yes | No | No | Progressive disclosure |
| Capture pairing and recording | Yes | Yes | No | No | Approved origins only |
| Text and video authoring UI | Foundation | Yes | No | No | Calibration/provider qualification required |
| Exact-draft test and publication | Foundation | Yes | No | No | Server evidence required |
| Attended extension runs | Foundation | Controlled fixture | No | No | Beta distribution required |
| Hosted schedules | Foundation | Component tests | No | No | Disabled until qualified |
| Run evidence, repair, and beta views | Foundation | Yes | No | No | Never imply customer proof |

## Copy rules

- Never say “installed” when no approved distribution destination exists.
- Never describe a synthetic, fixture, or controlled run as a customer result.
- Never imply that all websites, actions, or hosted sessions are supported.
- Keep unavailable, degraded, paused, and review-required states visible and actionable.
- The backend capability matrix and security gates decide whether an execution path may be enabled.
