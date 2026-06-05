import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

const MANIFEST_SCHEMA = "humestone.promotion_review.manifest.v1";

const PROMOTION_REVIEW_STATUSES = [
  "evidence-only",
  "candidate",
  "confirmed",
  "instruction-grade",
  "stale",
  "superseded",
  "disputed",
  "rejected",
] as const;

type PromotionReviewStatus = (typeof PROMOTION_REVIEW_STATUSES)[number];

interface PromotionReviewSource {
  kind: string;
  value: string | null;
  url: string | null;
  local_path: string | null;
}

interface PromotionReviewSourceRefs {
  processed_item_path: string | null;
  source_packet_path: string | null;
  capture_handoff_path: string | null;
  source: PromotionReviewSource;
  github_issue?: {
    number?: number;
    url?: string;
  };
}

interface PromotionReviewItem {
  id: string;
  status: PromotionReviewStatus;
  title: string;
  source_refs: PromotionReviewSourceRefs;
  review: {
    reviewed_at: string | null;
    reviewed_by: string;
    notes: string;
  };
}

export interface PromotionReviewManifest {
  schema: string;
  updated_at: string;
  items: PromotionReviewItem[];
}

export function getPromotionReviewStatuses(): readonly PromotionReviewStatus[] {
  return PROMOTION_REVIEW_STATUSES;
}

export function getPromotionReviewManifestPath(): string {
  if (process.env.OB1_PROMOTION_REVIEW_MANIFEST_PATH) {
    return process.env.OB1_PROMOTION_REVIEW_MANIFEST_PATH;
  }

  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "..",
    "..",
    "..",
    "How Open Brain Runs",
    "stone-workbench",
    "content-inbox",
    "promotion-review",
    "review-manifest.json",
  );
}

export async function loadPromotionReviewManifest(): Promise<{
  manifestPath: string;
  manifest: PromotionReviewManifest;
}> {
  const manifestPath = getPromotionReviewManifestPath();
  const raw = await readFile(manifestPath, "utf8");
  const parsed = JSON.parse(raw) as PromotionReviewManifest;

  if (parsed.schema !== MANIFEST_SCHEMA) {
    throw new Error(
      `Unexpected manifest schema: ${parsed.schema || "missing"} (expected ${MANIFEST_SCHEMA})`,
    );
  }

  if (!Array.isArray(parsed.items)) {
    throw new Error("Promotion review manifest is missing items[]");
  }

  for (const item of parsed.items) {
    if (!PROMOTION_REVIEW_STATUSES.includes(item.status)) {
      throw new Error(`Invalid promotion status in manifest item ${item.id}`);
    }
  }

  return { manifestPath, manifest: parsed };
}
