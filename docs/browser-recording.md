# Browser recording 2.0

The recorder creates an explicit capture session instead of a loose list of clicks. Start, pause, resume, stop, synchronize, finalize, and discard are visible in the extension. A progressive timeline shows the latest meaningful actions without exposing raw entered values.

`capture-evidence.ts` collects semantic element evidence and normalizes transient URLs. `content-capture.ts` observes open-shadow composed paths, frames, form boundaries, route changes, reloads, and meaningful controls. `capture-session.ts` owns lifecycle, stable sequencing, typing coalescing, duplicate suppression, bounded batches, and recovery rules. `capture-storage.ts` is the local durability boundary; `capture-sync.ts` is the only API transport.

The extension and API negotiate protocol version, capabilities, and maximum batch size before synchronization. One-time dashboard pairing creates a bearer credential for the extension because Manifest V3 requests cannot depend on the dashboard’s same-site cookie. Temporary network loss leaves the validated session in Chrome storage for an alarm- or startup-driven retry.

The report demonstration is represented as navigation, semantic click, download start, and download completion events. The recorder contains no report-runner branch; workflow compilation and execution consume the resulting evidence later.
