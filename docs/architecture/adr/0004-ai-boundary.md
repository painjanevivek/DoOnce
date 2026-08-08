# ADR-0004: Use AI for authoring and repair

**Status:** Accepted  
**Date:** 2026-08-09

## Context

Model-guided browser agents are useful when interpreting intent or adapting to a changed page, but repeated model decisions make normal runs slower, costlier, and harder to reproduce.

## Decision

Use AI providers for draft authoring, ambiguity resolution, and repair proposals. Normal workflow execution interprets the published WorkflowSpec without a model dependency.

## Consequences

- Model output is structured and schema-validated.
- Provider and prompt versions are recorded as provenance.
- Model-provider outages do not stop already published deterministic workflows.
