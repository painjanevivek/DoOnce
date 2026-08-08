# Consuming the DoOnce protocol

The backend repository owns the protocol. This repository contains a generated, checksum-pinned snapshot in `contracts/`. `npm run contracts:verify` runs before TypeScript compilation and stops the build when the schema or generated types differ from the manifest.

The browser extension compiles value-free capture summaries into `WorkflowSpec` v1 and validates the result before export. The dashboard validates an embedded spec before accepting an imported capture, then shows a compact summary first and keeps per-step targets and expected outcomes behind expandable details.

The renderer is action-generic. A report download uses the same title, expected-outcome, page, and locator-strategy presentation as navigation, reads, input, comparisons, approvals, and stop steps. Importing a capture remains local and never saves, publishes, or executes it.

When the backend contract changes, use the backend export command to refresh this snapshot. Do not hand-edit `protocol.ts`, the schema snapshot, or their hashes independently. A breaking change must arrive as a new protocol version with an explicit compatibility path for stored captures.
