# ADR-0002: Keep independently deployable repositories

**Status:** Accepted  
**Date:** 2026-08-09

## Context

The dashboard/extension and backend are independent Git repositories with separate remotes. There is no root repository or remote that can receive a history-preserving monorepo migration.

## Decision

Keep the two repositories independently deployable. The backend owns canonical JSON Schemas and OpenAPI contracts. A versioned contract artifact and compatibility fixtures synchronize consumers. Manual duplication of TypeScript interfaces is not allowed.

## Consequences

- Each repository can be released independently.
- Contract changes require compatibility checks in both repositories.
- A future monorepo remains possible only after a destination remote and history migration are explicitly approved.
