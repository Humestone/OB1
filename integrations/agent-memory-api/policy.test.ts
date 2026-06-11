import { assertEquals } from "jsr:@std/assert@1";

import {
  allowedScopeViolation,
  buildMemoryThoughtFilter,
  type RecallScope,
  reviewTransition,
  type ScopedMemory,
  scopeGuardViolation,
  scopeMatches,
} from "./policy.ts";

const baseScope: RecallScope = {
  visibility: "project",
  project_only: true,
  include_unconfirmed: false,
  include_stale: false,
};

function memory(overrides: Partial<ScopedMemory> = {}): ScopedMemory {
  return {
    workspace_id: "workspace-1",
    project_id: "project-1",
    channel_id: "channel-1",
    visibility: "project",
    lifecycle_status: "active",
    requires_user_confirmation: false,
    review_status: "confirmed",
    ...overrides,
  };
}

Deno.test("buildMemoryThoughtFilter returns none when semantic search has no thought ids", () => {
  assertEquals(buildMemoryThoughtFilter([]), { mode: "none", thoughtIds: [] });
});

Deno.test("buildMemoryThoughtFilter returns thought ids when semantic search found candidates", () => {
  assertEquals(buildMemoryThoughtFilter(["thought-1", "thought-2"]), {
    mode: "thought_ids",
    thoughtIds: ["thought-1", "thought-2"],
  });
});

Deno.test("allowedScopeViolation enforces workspace and project allowlists", () => {
  assertEquals(
    allowedScopeViolation(
      { workspace_id: "workspace-1", project_id: "project-1" },
      { workspace_id: "workspace-1", project_id: "project-1" },
    ),
    null,
  );
  assertEquals(
    allowedScopeViolation(
      { workspace_id: "workspace-2", project_id: "project-1" },
      { workspace_id: "workspace-1", project_id: "project-1" },
    ),
    "workspace_not_allowed",
  );
  assertEquals(
    allowedScopeViolation(
      { workspace_id: "workspace-1", project_id: "project-2" },
      { workspace_id: "workspace-1", project_id: "project-1" },
    ),
    "project_not_allowed",
  );
});

Deno.test("scopeGuardViolation rejects ID read records outside requested scope", () => {
  assertEquals(
    scopeGuardViolation(
      { workspace_id: "workspace-1", project_id: "project-1" },
      { requested: { workspace_id: "workspace-1", project_id: "project-1" } },
    ),
    null,
  );
  assertEquals(
    scopeGuardViolation(
      { workspace_id: "workspace-2", project_id: "project-1" },
      { requested: { workspace_id: "workspace-1", project_id: "project-1" } },
    ),
    "workspace_mismatch",
  );
  assertEquals(
    scopeGuardViolation(
      { workspace_id: "workspace-1", project_id: "project-2" },
      { requested: { workspace_id: "workspace-1", project_id: "project-1" } },
    ),
    "project_mismatch",
  );
});

Deno.test("scopeMatches blocks personal memory unless personal visibility is requested", () => {
  assertEquals(
    scopeMatches(memory({ visibility: "personal" }), {
      workspace_id: "workspace-1",
      project_id: "project-1",
      channel: {},
      scope: baseScope,
    }),
    false,
  );
  assertEquals(
    scopeMatches(memory({ visibility: "personal" }), {
      workspace_id: "workspace-1",
      project_id: "project-1",
      channel: {},
      scope: { ...baseScope, visibility: "personal" },
    }),
    true,
  );
});

Deno.test("scopeMatches respects project_only project filter", () => {
  assertEquals(
    scopeMatches(memory({ project_id: "other-project" }), {
      workspace_id: "workspace-1",
      project_id: "project-1",
      channel: {},
      scope: baseScope,
    }),
    false,
  );
});

Deno.test("scopeMatches blocks channel memory outside the requested channel", () => {
  assertEquals(
    scopeMatches(memory({ visibility: "channel", channel_id: "channel-2" }), {
      workspace_id: "workspace-1",
      project_id: "project-1",
      channel: { id: "channel-1" },
      scope: { ...baseScope, visibility: "channel" },
    }),
    false,
  );
});

Deno.test("scopeMatches allows workspace memory in project recall but blocks organization memory unless requested", () => {
  assertEquals(
    scopeMatches(memory({ visibility: "workspace", project_id: null }), {
      workspace_id: "workspace-1",
      project_id: "project-1",
      channel: {},
      scope: baseScope,
    }),
    true,
  );
  assertEquals(
    scopeMatches(memory({ visibility: "organization", project_id: null }), {
      workspace_id: "workspace-1",
      project_id: "project-1",
      channel: {},
      scope: baseScope,
    }),
    false,
  );
  assertEquals(
    scopeMatches(memory({ visibility: "organization", project_id: null }), {
      workspace_id: "workspace-1",
      project_id: "project-1",
      channel: {},
      scope: { ...baseScope, visibility: "organization" },
    }),
    true,
  );
});

Deno.test("reviewTransition marks a merged memory as merged and non-instructional", () => {
  assertEquals(
    reviewTransition({ action: "merge", related_memory_id: "target-memory" }),
    {
      memoryUpdates: {
        review_status: "merged",
        can_use_as_instruction: false,
        requires_user_confirmation: false,
      },
      relatedMemoryUpdates: {},
      relation: {
        to_memory_id: "target-memory",
        relation: "merged_into",
      },
    },
  );
});

Deno.test("reviewTransition marks the related memory superseded when current memory supersedes it", () => {
  assertEquals(
    reviewTransition({ action: "supersede", related_memory_id: "old-memory" }),
    {
      memoryUpdates: {},
      relatedMemoryUpdates: {
        lifecycle_status: "superseded",
        review_status: "stale",
        can_use_as_instruction: false,
      },
      relation: {
        to_memory_id: "old-memory",
        relation: "supersedes",
      },
    },
  );
});

Deno.test("reviewTransition keeps confirm semantics instruction-grade only after confirmation", () => {
  assertEquals(reviewTransition({ action: "confirm" }).memoryUpdates, {
    review_status: "confirmed",
    provenance_status: "user_confirmed",
    can_use_as_instruction: true,
    requires_user_confirmation: false,
  });
});
