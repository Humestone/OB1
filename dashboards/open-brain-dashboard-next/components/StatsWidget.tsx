import type { StatsResponse } from "@/lib/types";
import { TypeBadge } from "./ThoughtCard";

/* The cockpit KPI treatment: one giant glowing number per card, eyebrow
   micro-label above, plain-language caption below, tone wash + glow orb from
   off-card. Total thoughts carries the neutral (violet) data accent —
   volume/queue, never brand amber. */
export function StatsWidget({ stats }: { stats: StatsResponse }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total thoughts — the one big glowing number */}
      <div
        className="cm-card cm-card-wash cm-kpi p-5"
        style={{ ["--cm-accent" as string]: "var(--mc-neutral)" }}
      >
        <div className="cm-glow-orb" />
        <div className="relative">
          <p className="cm-eyebrow mb-3.5">Total thoughts</p>
          <p
            className="cm-kpi-num mb-3"
            style={{
              color: "var(--mc-neutral)",
              textShadow: "0 0 38px rgba(167, 139, 250, 0.33)",
            }}
          >
            {stats.total_thoughts.toLocaleString()}
          </p>
          <p className="cm-caption">
            {stats.window_days === "all"
              ? "Everything the brain holds."
              : `Captured over the last ${stats.window_days} days.`}
          </p>
        </div>
      </div>

      {/* Type distribution */}
      <div className="cm-card p-5">
        <p className="cm-eyebrow mb-3.5">By type</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.types).map(([type, count]) => (
            <div key={type} className="flex items-center gap-1.5">
              <TypeBadge type={type} />
              <span className="text-xs text-text-muted">
                {(count as number).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top topics */}
      <div className="cm-card p-5">
        <p className="cm-eyebrow mb-3.5">Top topics</p>
        <div className="space-y-1.5">
          {stats.top_topics?.slice(0, 5).map((t) => (
            <div
              key={t.topic}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-text-secondary truncate">{t.topic}</span>
              <span className="text-text-muted text-xs ml-2">{t.count}</span>
            </div>
          ))}
          {(!stats.top_topics || stats.top_topics.length === 0) && (
            <p className="cm-caption">No topic data</p>
          )}
        </div>
      </div>
    </div>
  );
}
