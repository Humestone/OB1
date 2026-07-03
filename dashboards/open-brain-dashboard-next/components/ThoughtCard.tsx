import Link from "next/link";
import type { Thought } from "@/lib/types";
import { FormattedDate } from "@/components/FormattedDate";

/*
 * Colour = concept: the five data accents are reserved for status semantics
 * (good / attention / blocked / info / neutral). Thought TYPE is a category,
 * not a status, so type badges are quiet monochrome chips and the label
 * carries the meaning. The one exception: decisions are the load-bearing
 * record type in Company Memory, so they keep the neutral (violet) accent.
 */
const typeColors: Record<string, string> = {
  idea: "bg-bg-elevated text-text-secondary border-border",
  task: "bg-bg-elevated text-text-secondary border-border",
  person_note: "bg-bg-elevated text-text-secondary border-border",
  reference: "bg-bg-elevated text-text-secondary border-border",
  decision: "bg-neutral/15 text-neutral border-neutral/20",
  lesson: "bg-bg-elevated text-text-secondary border-border",
  meeting: "bg-bg-elevated text-text-secondary border-border",
  journal: "bg-bg-elevated text-text-secondary border-border",
};

export function TypeBadge({ type }: { type: string }) {
  const colors = typeColors[type] || typeColors.reference;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors}`}
    >
      {type}
    </span>
  );
}

export function ThoughtCard({
  thought,
  showLink = true,
}: {
  thought: Thought;
  showLink?: boolean;
}) {
  const preview =
    thought.content.length > 200
      ? thought.content.slice(0, 200) + "..."
      : thought.content;

  const inner = (
    <div className="cm-row p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <TypeBadge type={thought.type} />
          {thought.importance > 0 && (
            <span className="text-xs text-text-muted">
              imp: {thought.importance}
            </span>
          )}
        </div>
        <FormattedDate date={thought.created_at} className="text-xs text-text-muted whitespace-nowrap" />
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{preview}</p>
      {thought.source_type && (
        <span className="inline-block mt-2 text-xs text-text-muted">
          {thought.source_type}
        </span>
      )}
    </div>
  );

  if (showLink) {
    return <Link href={`/thoughts/${thought.id}`}>{inner}</Link>;
  }
  return inner;
}
