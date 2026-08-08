# DoOnce product definition

## Product statement

DoOnce lets a user demonstrate or describe a recurring browser task once, converts that input into an editable WorkflowSpec, and runs the published workflow again through a compatible browser executor.

## First customer journey

1. Install the Chrome extension.
2. Start a browser recording.
3. Demonstrate downloading a report.
4. Review the generated workflow draft.
5. Replace the report date with a reusable input.
6. Test the exact draft.
7. Publish an immutable version.
8. Run the workflow again and receive the verified report.

## Product principles

- WorkflowSpec is the product's durable source of truth.
- Recording, text, and video are authoring inputs for the same workflow format.
- Normal runs interpret the published workflow rather than asking a model to rediscover the task.
- AI may draft or propose repairs, but its output must compile into WorkflowSpec.
- Extension execution serves attended browser sessions; a hosted executor serves unattended runs.
- A run succeeds only when its declared outcome is verified.

## Initial product metrics

- Recording completion rate.
- Recording-to-draft conversion rate.
- First test-run success rate.
- Published workflow success rate.
- Correctly classified failure rate.
- Repair proposal acceptance and post-repair success rate.
- Median authoring and run duration.
- Model cost per generated or repaired workflow.
- Executor availability.

Numeric targets will be set after representative fixture and beta data exists.
