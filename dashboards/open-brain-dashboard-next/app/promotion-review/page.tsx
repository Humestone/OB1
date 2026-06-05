import Link from "next/link";
import { FormattedDate } from "@/components/FormattedDate";
import { requireSessionOrRedirect } from "@/lib/auth";
import {
  getPromotionReviewStatuses,
  loadPromotionReviewManifest,
} from "@/lib/promotion-review";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  "evidence-only": "Evidence Only",
  candidate: "Candidate",
  confirmed: "Confirmed",
  "instruction-grade": "Instruction Grade",
  stale: "Stale",
  superseded: "Superseded",
  disputed: "Disputed",
  rejected: "Rejected",
  all: "All",
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case "candidate":
      return "border-sky-500/35 bg-sky-500/12 text-sky-200";
    case "confirmed":
      return "border-emerald-500/35 bg-emerald-500/12 text-emerald-200";
    case "instruction-grade":
      return "border-violet/45 bg-violet/15 text-violet-200";
    case "evidence-only":
      return "border-zinc-500/35 bg-zinc-500/10 text-zinc-200";
    case "stale":
      return "border-amber-500/35 bg-amber-500/12 text-amber-200";
    case "superseded":
      return "border-slate-500/35 bg-slate-500/12 text-slate-200";
    case "disputed":
      return "border-orange-500/35 bg-orange-500/12 text-orange-200";
    case "rejected":
      return "border-rose-500/35 bg-rose-500/12 text-rose-200";
    default:
      return "border-border bg-bg-surface text-text-secondary";
  }
}

export default async function PromotionReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireSessionOrRedirect();
  const params = await searchParams;
  const statuses = getPromotionReviewStatuses();
  const statusFilter =
    params.status && statuses.includes(params.status as (typeof statuses)[number])
      ? params.status
      : "all";

  let manifestPath = "";
  let updatedAt = "";
  let items: Awaited<
    ReturnType<typeof loadPromotionReviewManifest>
  >["manifest"]["items"] = [];
  let loadError: string | null = null;

  try {
    const loaded = await loadPromotionReviewManifest();
    manifestPath = loaded.manifestPath;
    updatedAt = loaded.manifest.updated_at;
    items = loaded.manifest.items;
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Failed to load promotion review manifest.";
  }

  const counts: Record<string, number> = {};
  for (const status of statuses) counts[status] = 0;
  for (const item of items) counts[item.status] = (counts[item.status] ?? 0) + 1;

  const filtered =
    statusFilter === "all"
      ? items
      : items.filter((item) => item.status === statusFilter);

  const sorted = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

  function statusUrl(nextStatus: string): string {
    if (nextStatus === "all") return "/promotion-review";
    const sp = new URLSearchParams();
    sp.set("status", nextStatus);
    return `/promotion-review?${sp.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Promotion Review Queue</h1>
        <p className="text-sm text-text-secondary">
          Local read-only queue backed by the Phase 3 manifest contract.
        </p>
        <p className="text-xs text-amber-200">
          No write controls are available in this view.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <Link
            key={status}
            href={statusUrl(status)}
            className={`border px-3 py-1.5 text-sm transition-colors ${
              statusFilter === status
                ? "border-violet/30 bg-violet-surface text-violet"
                : "border-border bg-bg-surface text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`}
          >
            {STATUS_LABELS[status]} ({counts[status] ?? 0})
          </Link>
        ))}
        <Link
          href={statusUrl("all")}
          className={`border px-3 py-1.5 text-sm transition-colors ${
            statusFilter === "all"
              ? "border-violet/30 bg-violet-surface text-violet"
              : "border-border bg-bg-surface text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          }`}
        >
          All ({items.length})
        </Link>
      </div>

      {loadError ? (
        <div className="rounded border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {loadError}
        </div>
      ) : (
        <>
          <div className="ob1-glass-panel p-4 text-xs text-text-muted space-y-1">
            <p>
              <span className="text-text-secondary">Manifest:</span>{" "}
              <code className="break-all">{manifestPath}</code>
            </p>
            <p>
              <span className="text-text-secondary">Schema:</span>{" "}
              <code>humestone.promotion_review.manifest.v1</code>
            </p>
            <p>
              <span className="text-text-secondary">Updated:</span>{" "}
              <FormattedDate date={updatedAt} />
            </p>
          </div>

          <div className="ob1-glass-panel overflow-x-auto">
            <table className="w-full min-w-[1150px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3 text-left font-medium w-56">Candidate</th>
                  <th className="px-4 py-3 text-left font-medium w-40">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium w-56">Review</th>
                  <th className="px-4 py-3 text-left font-medium w-80">Source Refs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-text-muted"
                    >
                      No promotion candidates in this status.
                    </td>
                  </tr>
                ) : (
                  sorted.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary break-all">
                        {item.id}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex border px-2 py-1 text-xs ${statusBadgeClass(
                            item.status,
                          )}`}
                        >
                          {STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-text-primary">{item.title}</p>
                        {item.source_refs.github_issue?.url ? (
                          <a
                            href={item.source_refs.github_issue.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs text-violet hover:text-violet-300"
                          >
                            Issue #{item.source_refs.github_issue.number}
                          </a>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary space-y-1">
                        <p>
                          <span className="text-text-muted">reviewed_at:</span>{" "}
                          {item.review.reviewed_at ? (
                            <FormattedDate date={item.review.reviewed_at} />
                          ) : (
                            "not reviewed"
                          )}
                        </p>
                        <p>
                          <span className="text-text-muted">reviewed_by:</span>{" "}
                          {item.review.reviewed_by || "none"}
                        </p>
                        <p className="break-words">
                          <span className="text-text-muted">notes:</span>{" "}
                          {item.review.notes || "none"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary space-y-1">
                        <p className="break-all">
                          <span className="text-text-muted">processed:</span>{" "}
                          <code>{item.source_refs.processed_item_path || "none"}</code>
                        </p>
                        <p className="break-all">
                          <span className="text-text-muted">source packet:</span>{" "}
                          <code>{item.source_refs.source_packet_path || "none"}</code>
                        </p>
                        <p className="break-all">
                          <span className="text-text-muted">capture handoff:</span>{" "}
                          <code>{item.source_refs.capture_handoff_path || "none"}</code>
                        </p>
                        <p className="break-all">
                          <span className="text-text-muted">source kind:</span>{" "}
                          <code>{item.source_refs.source.kind}</code>
                        </p>
                        <p className="break-all">
                          <span className="text-text-muted">source value:</span>{" "}
                          <code>{item.source_refs.source.value || "none"}</code>
                        </p>
                        <p className="break-all">
                          <span className="text-text-muted">source url:</span>{" "}
                          <code>{item.source_refs.source.url || "none"}</code>
                        </p>
                        <p className="break-all">
                          <span className="text-text-muted">source local_path:</span>{" "}
                          <code>{item.source_refs.source.local_path || "none"}</code>
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
