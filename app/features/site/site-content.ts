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
] satisfies AuthoringPath[]);

export const taskExamples = Object.freeze([
  "Open the approved report",
  "Review the report filters",
  "Download one report file",
  "Verify the downloaded artifact",
  "Read the attended run receipt",
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
] satisfies ExampleScenario[]);
