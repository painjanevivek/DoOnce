import { AppFrame } from "../../components/app-frame";
import WorkflowStudio from "../../features/workflows/workflow-studio";

export default async function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppFrame
      links={[{ href: "/workflows", label: "Workflow library" }]}
      mainId="workflow-editor"
      skipLabel="Skip to workflow editor"
    >
      <WorkflowStudio workflowId={id} />
    </AppFrame>
  );
}
