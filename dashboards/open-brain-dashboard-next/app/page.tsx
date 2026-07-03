import { fetchStats, fetchThoughts } from "@/lib/api";
import { requireSessionOrRedirect, getSession } from "@/lib/auth";
import { StatsWidget } from "@/components/StatsWidget";
import { KanbanSummary } from "@/components/KanbanSummary";
import { ThoughtCard } from "@/components/ThoughtCard";
import { AddToBrain } from "@/components/AddToBrain";
import { isGovernanceReadOnly } from "@/lib/governance";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { apiKey } = await requireSessionOrRedirect();
  const session = await getSession();
  const excludeRestricted = !session.restrictedUnlocked;
  const governanceReadOnly = isGovernanceReadOnly();

  let stats, recent;
  try {
    [stats, recent] = await Promise.all([
      fetchStats(apiKey, undefined, excludeRestricted),
      fetchThoughts(apiKey, { page: 1, per_page: 5, exclude_restricted: excludeRestricted }),
    ]);
  } catch (err) {
    return (
      <div className="space-y-6">
        <h1 className="cm-hero">Company Memory</h1>
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger text-sm">
          Failed to load dashboard data. Check API connection.
          <br />
          <span className="text-text-muted">
            {err instanceof Error ? err.message : "Unknown error"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2.5">
        <h1 className="cm-hero">Company Memory</h1>
        <p className="cm-caption">
          Overview of your second brain — what it holds and what just landed.
        </p>
      </div>

      <StatsWidget stats={stats} />

      <KanbanSummary />

      {/* Add to Brain — the memory surface's dock, framed like the Ask dock */}
      <div className="cm-dock p-5">
        <h2 className="cm-eyebrow mb-3">
          <span style={{ color: "var(--mc-brand)" }}>✦</span> Add to Brain
        </h2>
        <p className="cm-caption mb-3.5">
          Paste a thought, notes, or source text. Open Brain decides whether to
          save one thought or extract several.
        </p>
        <AddToBrain rows={3} readOnlyMode={governanceReadOnly} />
      </div>

      {/* Recent activity */}
      <div>
        <div className="mb-4">
          <p className="cm-eyebrow mb-2">Recent activity</p>
          <h2 className="cm-section-head">What just landed</h2>
          <p className="cm-caption">The latest captures into the brain.</p>
        </div>
        <div className="space-y-3">
          {recent.data.map((thought) => (
            <ThoughtCard key={thought.id} thought={thought} />
          ))}
          {recent.data.length === 0 && (
            <p className="text-text-muted text-sm">No thoughts yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
