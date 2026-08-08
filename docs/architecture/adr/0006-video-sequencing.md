# ADR-0006: Build video authoring after the core workflow

**Status:** Accepted  
**Date:** 2026-08-09

## Context

Pure video shows pixels and timing but does not reliably contain URLs, DOM semantics, iframe boundaries, exact entered values, or machine-verifiable outcomes.

## Decision

Build recording, WorkflowSpec, compilation, editing, execution, and verification before video import. Prefer synchronized video and browser telemetry. Pure video produces a lower-confidence draft that requires live-browser calibration.

## Consequences

- Video reuses the existing compiler and editor.
- Visual coordinates never become durable published locators by themselves.
- The product avoids maintaining a separate video-only automation format.
