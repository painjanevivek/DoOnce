import { AppFrame } from "../components/app-frame";
import WorkflowLibrary from "../features/workflows/workflow-library";

export default function WorkflowsPage() {
  return (
    <AppFrame
      footer
      links={[
        { href: "/", label: "Product" },
        { href: "/privacy", label: "Privacy" },
        { href: "/terms", label: "Terms" },
      ]}
      mainId="workflow-main"
      skipLabel="Skip to workflows"
    >
      <WorkflowLibrary />
    </AppFrame>
  );
}
