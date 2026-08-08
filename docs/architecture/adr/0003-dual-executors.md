# ADR-0003: Support extension and hosted executors

**Status:** Accepted  
**Date:** 2026-08-09

## Context

The Chrome extension can use a user's existing authenticated browser session, but it cannot guarantee unattended execution when Chrome is closed or a Manifest V3 service worker is suspended.

## Decision

Define one executor contract with two adapters:

- an extension executor for attended runs;
- a Playwright executor for hosted, scheduled, and CI runs.

## Consequences

- WorkflowSpec declares required runtime capabilities.
- The orchestrator rejects incompatible executor assignments before a run starts.
- Scheduling UI must state which runtime and browser session a workflow requires.
