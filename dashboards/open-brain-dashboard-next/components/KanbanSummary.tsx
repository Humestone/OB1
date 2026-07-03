"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { KanbanStatus } from "@/lib/types";
import { KANBAN_STATUSES, KANBAN_LABELS } from "@/lib/types";

/* Colour = concept: queued=neutral(violet), in-flight=info(blue),
   needs-you=attention(amber), done=good(emerald); "new" is not yet in the
   system, so it stays monochrome. */
const STATUS_COLORS: Record<string, string> = {
  new: "bg-bg-elevated text-text-secondary border-border",
  planning: "bg-neutral/15 text-neutral border-neutral/20",
  active: "bg-info/15 text-info border-info/20",
  review: "bg-warning/15 text-warning border-warning/20",
  done: "bg-success/15 text-success border-success/20",
};

export function KanbanSummary() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kanban")
      .then((res) => res.json())
      .then((data) => {
        const grouped: Record<string, number> = {};
        for (const s of KANBAN_STATUSES) grouped[s] = 0;
        for (const t of data.thoughts || []) {
          const status = t.status ?? "new";
          if (grouped[status] !== undefined) grouped[status]++;
        }
        setCounts(grouped);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const totalActive = (counts.active || 0) + (counts.planning || 0) + (counts.review || 0);

  if (isLoading) {
    return (
      <div className="cm-card p-4">
        <div className="h-4 w-32 bg-bg-hover rounded animate-pulse mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 w-16 bg-bg-hover rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Link href="/kanban" className="block group">
      <div className="cm-card p-4">
        <div className="flex items-start justify-between mb-3.5">
          <div>
            <p className="cm-eyebrow mb-2">Workflow</p>
            <h2 className="cm-section-head">Where work stands</h2>
          </div>
          <span className="text-xs text-text-muted group-hover:text-violet transition-colors">
            Open workflow →
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {KANBAN_STATUSES.map((status) => {
            const count = counts[status] || 0;
            if (count === 0 && status === "done") return null;
            const colorClass = STATUS_COLORS[status] || STATUS_COLORS.new;
            return (
              <span
                key={status}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}
              >
                {KANBAN_LABELS[status as KanbanStatus]}
                <span className="font-bold">{count}</span>
              </span>
            );
          })}
        </div>
        {totalActive > 0 && (
          <p className="text-xs text-text-muted mt-2">
            {totalActive} item{totalActive !== 1 ? "s" : ""} in progress
          </p>
        )}
      </div>
    </Link>
  );
}
