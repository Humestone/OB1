import { requireSessionOrRedirect } from "@/lib/auth";
import { KanbanBoard } from "@/components/KanbanBoard";

export const dynamic = "force-dynamic";


export default async function KanbanPage() {
  await requireSessionOrRedirect();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="cm-hero mb-2.5">Workflow</h1>
        <p className="cm-caption">
          Track tasks and ideas through your workflow
        </p>
      </div>
      <KanbanBoard />
    </div>
  );
}
