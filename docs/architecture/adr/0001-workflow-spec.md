# ADR-0001: WorkflowSpec is the central artifact

**Status:** Accepted  
**Date:** 2026-08-09

## Context

Browser recording, text instructions, video demonstrations, the editor, executors, verification, and repair need a shared representation. Allowing each feature to invent its own format would make workflows impossible to migrate or test consistently.

## Decision

Create a versioned, human-readable WorkflowSpec. Every authoring input produces a draft WorkflowSpec. Every executor consumes a published WorkflowSpec and emits the same step/run result contracts.

## Consequences

- Contract design precedes broad feature development.
- AI framework types cannot become stored domain types.
- New executors and authoring providers must pass compatibility tests.
- Schema migrations and backward compatibility become explicit release responsibilities.
