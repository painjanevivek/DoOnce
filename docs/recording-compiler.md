# Reviewing compiled recordings

The workflow dashboard treats synchronized recordings as an inbox. It loads small `CaptureSessionSummary` records first, so the page does not download complete capture timelines just to show a list.

An author can compile a finalized recording into a canonical draft. The first view shows action, step, combined-event, and review counts. Compiler warnings and the generated workflow are disclosed next. Exact provenance counts and the source digest stay behind an additional details control. This ordering keeps the common path readable while preserving the evidence needed for technical review.

The dashboard validates `CaptureSessionSummary` and `WorkflowCompilation` against the synchronized protocol snapshot before rendering. A failed or unknown response is not accepted as a draft. AI-assisted authoring suggestions, when configured in the future, remain visibly separate from the deterministic workflow until an author chooses to apply them.
