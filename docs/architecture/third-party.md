# Third-party architecture inventory

| Project | License at review | DoOnce use | Integration boundary |
|---|---|---|---|
| [Browserclaw](https://github.com/idan-rubin/browserclaw) | MIT | Semantic snapshot and locator-resolution reference | Reference first; optional hosted-executor adapter after compatibility tests |
| [Stagehand](https://github.com/browserbase/stagehand) | MIT | Text authoring and browser-observation experiment | Feature-flagged provider that must output WorkflowSpec |
| [Nanobrowser](https://github.com/nanobrowser/nanobrowser) | Apache-2.0 | Extension organization and planner/executor separation | Architecture reference; no broad permission or autonomous-agent import |
| [Webwright](https://github.com/microsoft/Webwright) | MIT | Verified artifact and version-history concepts | Architecture reference; no arbitrary generated Python execution |
| [Open Agent Studio](https://github.com/rohanarun/Open-Agent-Studio) | Apache-2.0 | Visual workflow and future video-authoring reference | UX reference; no desktop coordinate automation in the browser core |

Before a direct dependency is added, record its pinned version, transitive licenses, copied files, required notices, security review, maintenance signal, and removal strategy. Unlicensed repositories are research-only and their code must not be copied.
