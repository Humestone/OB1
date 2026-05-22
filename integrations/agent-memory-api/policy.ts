export type RecallScope = {
  visibility?: string | null;
  project_only: boolean;
  include_unconfirmed: boolean;
  include_stale: boolean;
};

export type RecallPolicyRequest = {
  workspace_id: string;
  project_id?: string | null;
  channel: {
    id?: string | null;
  };
  scope: RecallScope;
};

export type ScopedMemory = {
  workspace_id: string;
  project_id: string | null;
  channel_id: string | null;
  visibility: string;
  lifecycle_status: string;
  requires_user_confirmation: boolean;
  review_status: string;
};

export function buildMemoryThoughtFilter(thoughtIds: string[]) {
  const unique = [...new Set(thoughtIds.filter(Boolean))];
  return unique.length === 0
    ? { mode: "none" as const, thoughtIds: [] as string[] }
    : { mode: "thought_ids" as const, thoughtIds: unique };
}

export function scopeMatches(memory: ScopedMemory, req: RecallPolicyRequest): boolean {
  if (memory.workspace_id !== req.workspace_id) return false;
  if (req.scope.project_only && req.project_id && memory.project_id && memory.project_id !== req.project_id) return false;
  if (!req.scope.include_stale && ["stale", "superseded", "rejected", "disputed"].includes(memory.lifecycle_status)) return false;
  if (!req.scope.include_unconfirmed && memory.requires_user_confirmation && memory.review_status === "pending") return false;

  const requestedVisibility = req.scope.visibility || "project";
  if (memory.visibility === "personal") return requestedVisibility === "personal";
  if (memory.visibility === "channel") {
    return requestedVisibility === "channel" && Boolean(req.channel.id) && memory.channel_id === req.channel.id;
  }
  if (memory.visibility === "organization") return requestedVisibility === "organization";
  if (memory.visibility === "workspace") return ["project", "workspace", "organization"].includes(requestedVisibility);
  return true;
}

export type ReviewTransitionInput = {
  action: "confirm" | "edit" | "evidence_only" | "restrict_scope" | "mark_stale" | "merge" | "reject" | "dispute" | "supersede";
  visibility?: string;
  content?: string;
  summary?: string;
  related_memory_id?: string;
};

export function reviewTransition(input: ReviewTransitionInput) {
  const memoryUpdates: Record<string, unknown> = {};
  const relatedMemoryUpdates: Record<string, unknown> = {};
  let relation: { to_memory_id: string; relation: string } | null = null;

  if (input.action === "confirm") {
    Object.assign(memoryUpdates, {
      review_status: "confirmed",
      provenance_status: "user_confirmed",
      can_use_as_instruction: true,
      requires_user_confirmation: false,
    });
  } else if (input.action === "evidence_only") {
    Object.assign(memoryUpdates, {
      review_status: "evidence_only",
      can_use_as_instruction: false,
      can_use_as_evidence: true,
      requires_user_confirmation: false,
    });
  } else if (input.action === "reject") {
    Object.assign(memoryUpdates, {
      review_status: "rejected",
      lifecycle_status: "rejected",
      can_use_as_instruction: false,
      can_use_as_evidence: false,
    });
  } else if (input.action === "mark_stale") {
    Object.assign(memoryUpdates, {
      review_status: "stale",
      lifecycle_status: "stale",
      can_use_as_instruction: false,
    });
  } else if (input.action === "dispute") {
    Object.assign(memoryUpdates, {
      lifecycle_status: "disputed",
      provenance_status: "disputed",
      can_use_as_instruction: false,
    });
  } else if (input.action === "restrict_scope") {
    Object.assign(memoryUpdates, {
      review_status: "restricted",
      visibility: input.visibility || "personal",
    });
  } else if (input.action === "edit") {
    if (input.content) memoryUpdates.content = input.content;
    if (input.summary) memoryUpdates.summary = input.summary;
  } else if (input.action === "merge") {
    Object.assign(memoryUpdates, {
      review_status: "merged",
      can_use_as_instruction: false,
      requires_user_confirmation: false,
    });
    if (input.related_memory_id) {
      relation = { to_memory_id: input.related_memory_id, relation: "merged_into" };
    }
  } else if (input.action === "supersede" && input.related_memory_id) {
    Object.assign(relatedMemoryUpdates, {
      lifecycle_status: "superseded",
      review_status: "stale",
      can_use_as_instruction: false,
    });
    relation = { to_memory_id: input.related_memory_id, relation: "supersedes" };
  }

  return { memoryUpdates, relatedMemoryUpdates, relation };
}
