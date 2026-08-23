# ADR-0007: Keep WorkflowSpec declarative under Manifest V3

**Status:** accepted for controlled beta; Chrome Web Store review remains external

## Decision

The extension packages the complete action vocabulary, schema validation, policy evaluation, interpreter, locator resolution, assertions, and browser adapters. The API may send only a versioned `WorkflowSpec` that passes the packaged schema and capability negotiation. It cannot send JavaScript, WebAssembly, selectors that execute code, provider-native plans, dynamic modules, or an unrestricted command language.

Every received workflow is bounded by exact domains, 500 steps, known action kinds, finite locators, bounded patterns, per-step origin checks, active run leases, and explicit per-run approval for reversible writes. Unknown or unsupported data pauses. Published execution never evaluates model output.

## Rationale

The WorkflowSpec is product data interpreted by fixed packaged logic. This makes extension behavior reviewable and preserves deterministic versioning. It also narrows the risk that remote workflow delivery is treated as remotely hosted executable code.

## Release gate

Before store submission, the review package must include the schema, action inventory, build manifest, reviewer test workflow, privacy inventory, and proof that release bundles use an HTTPS API origin. If Chrome rejects this boundary, hosted execution or an approved enterprise distribution path must be used; the runtime must not be widened to bypass review.
