# ADR-0005: Use PostgreSQL-backed durable jobs

**Status:** Accepted  
**Date:** 2026-08-09

## Context

Authoring, repair, scheduling, and hosted workflow runs require durable asynchronous work. The backend already operates PostgreSQL.

## Decision

Introduce a queue abstraction backed initially by pg-boss and the existing PostgreSQL service.

## Consequences

- The initial deployment does not require Redis, Kafka, or Temporal.
- Jobs need idempotency keys, bounded retries, expiry, cancellation, and dead-letter visibility.
- A different queue can replace pg-boss behind the adapter if measured scale requires it.
