import { requireSessionOrRedirect } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEFAULT_WORKBENCH_URL = "https://stone-content-intake.vercel.app/workbench";

export default async function WorkbenchPage() {
  await requireSessionOrRedirect();

  const workbenchUrl =
    process.env.STONE_WORKBENCH_URL ||
    process.env.NEXT_PUBLIC_STONE_WORKBENCH_URL ||
    DEFAULT_WORKBENCH_URL;

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Workbench</h1>
          <p className="text-text-secondary text-sm">
            Stone live control surface
          </p>
        </div>
        <a
          href={workbenchUrl}
          target="_blank"
          rel="noreferrer"
          className="ob1-command-button h-9 px-3 text-sm"
        >
          Open Live
        </a>
      </div>

      <iframe
        title="Stone Workbench"
        src={workbenchUrl}
        className="min-h-[760px] flex-1 border border-border bg-bg-surface"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
