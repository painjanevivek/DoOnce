# Visual workflow editor

The workflow library and editor are separate focused screens. The library shows status, versions, recent-run evidence, and quick actions. The editor progressively discloses overview, ordered steps, inputs, test setup, version history, and read-only developer JSON.

The editor supports keyboard step reordering, drag reordering, insertion, duplication, deletion, assertions, forward-only branches, locator review, an extension locator-picker request, secret-aware variable previews, continuous validation, 50-snapshot undo/redo, and checksum-based autosave.

Invalid drafts remain in the current browser editing session but are not autosaved or publishable. If another tab or user changes the saved draft, the editor shows both deliberate choices: load the server copy or keep the local changes using the newest checksum. It never resolves the conflict silently.

Test mode validates inputs and displays the exact readiness state of every step. The interface explicitly says that execution is connected in the later deterministic-runner phase; a successful preview is not misrepresented as a completed browser run.
