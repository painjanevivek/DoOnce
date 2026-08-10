export interface AuthoringPath {
  id: "record" | "describe" | "video";
  title: string;
  summary: string;
  proof: string;
}

export interface ExampleScenario {
  kind: "example";
  role: string;
  task: string;
  authoring: AuthoringPath["id"];
  verification: string;
  artifact: string;
}

export const authoringPaths = Object.freeze([
  {
    id: "record",
    title: "Show it in Chrome",
    summary: "Record one careful demonstration.",
    proof: "Review every captured action before publishing.",
  },
  {
    id: "describe",
    title: "Describe the routine",
    summary: "Explain the task in plain language.",
    proof: "DoOnce compiles an editable draft, never an automatic publish.",
  },
  {
    id: "video",
    title: "Upload a short walkthrough",
    summary: "Use an existing demonstration video.",
    proof: "Calibrate uncertain moments before creating a draft.",
  },
] satisfies AuthoringPath[]);

export const taskExamples = Object.freeze([
  "Download weekly invoices",
  "Update a recruiting tracker",
  "Copy order exceptions into a report",
  "Reconcile portal totals",
  "Prepare a recurring compliance export",
]);

export const exampleScenarios = Object.freeze([
  {
    kind: "example",
    role: "Operations coordinator",
    task: "Download weekly supplier invoices",
    authoring: "record",
    verification: "Every expected supplier appears in the completed run.",
    artifact: "A timestamped invoice bundle",
  },
  {
    kind: "example",
    role: "Recruiting coordinator",
    task: "Copy shortlisted candidates into a tracker",
    authoring: "describe",
    verification: "Every required tracker column is populated.",
    artifact: "An updated recruiting sheet",
  },
  {
    kind: "example",
    role: "Finance analyst",
    task: "Reconcile portal totals",
    authoring: "video",
    verification: "The source and destination totals match.",
    artifact: "A reconciliation report",
  },
] satisfies ExampleScenario[]);
