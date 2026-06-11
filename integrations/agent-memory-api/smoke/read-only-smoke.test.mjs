import assert from "node:assert/strict";
import test from "node:test";

import {
  buildChecks,
  buildHarnessConfig,
  parseArgs,
} from "./read-only-smoke.mjs";

test("parseArgs defaults to dry-run mode", () => {
  const parsed = parseArgs(["node", "read-only-smoke.mjs"]);
  assert.equal(parsed.help, false);
  assert.equal(parsed.execute, false);
});

test("parseArgs enables execute mode with --execute", () => {
  const parsed = parseArgs(["node", "read-only-smoke.mjs", "--execute"]);
  assert.equal(parsed.help, false);
  assert.equal(parsed.execute, true);
});

test("buildHarnessConfig allows dry-run without endpoint and key", () => {
  const config = buildHarnessConfig({ execute: false }, {});
  assert.equal(config.execute, false);
  assert.equal(config.workspaceId, "humestone-agent-memory-staging");
  assert.equal(config.projectId, "phase-8c-readonly-smoke");
  assert.equal(config.outOfScopeWorkspaceId, "humestone-agent-memory-staging-out-of-scope");
  assert.equal(config.outOfScopeProjectId, "phase-8c-readonly-smoke-out-of-scope");
});

test("buildHarnessConfig blocks execute when read-only flag is missing", () => {
  assert.throws(
    () => buildHarnessConfig({ execute: true }, {
      OB1_AGENT_MEMORY_ENDPOINT: "https://example.supabase.co/functions/v1/agent-memory-api",
      OB1_AGENT_MEMORY_KEY: "fake-key",
    }),
    /AGENT_MEMORY_READ_ONLY=true/,
  );
});

test("buildHarnessConfig blocks execute unless allowlist env matches the requested scope", () => {
  assert.throws(
    () => buildHarnessConfig({ execute: true }, {
      AGENT_MEMORY_READ_ONLY: "true",
      OB1_AGENT_MEMORY_ENDPOINT: "https://example.supabase.co/functions/v1/agent-memory-api",
      OB1_AGENT_MEMORY_KEY: "fake-key",
      OB1_AGENT_MEMORY_WORKSPACE_ID: "workspace-1",
      OB1_AGENT_MEMORY_PROJECT_ID: "project-1",
    }),
    /AGENT_MEMORY_ALLOWED_WORKSPACE_ID/,
  );
  assert.throws(
    () => buildHarnessConfig({ execute: true }, {
      AGENT_MEMORY_READ_ONLY: "true",
      AGENT_MEMORY_ALLOWED_WORKSPACE_ID: "workspace-1",
      OB1_AGENT_MEMORY_ENDPOINT: "https://example.supabase.co/functions/v1/agent-memory-api",
      OB1_AGENT_MEMORY_KEY: "fake-key",
      OB1_AGENT_MEMORY_WORKSPACE_ID: "workspace-1",
      OB1_AGENT_MEMORY_PROJECT_ID: "project-1",
    }),
    /AGENT_MEMORY_ALLOWED_PROJECT_ID/,
  );
});

test("buildHarnessConfig blocks execute when query-string keys are enabled", () => {
  assert.throws(
    () => buildHarnessConfig({ execute: true }, {
      AGENT_MEMORY_READ_ONLY: "true",
      AGENT_MEMORY_ALLOW_QUERY_KEY: "true",
      AGENT_MEMORY_ALLOWED_WORKSPACE_ID: "workspace-1",
      AGENT_MEMORY_ALLOWED_PROJECT_ID: "project-1",
      OB1_AGENT_MEMORY_ENDPOINT: "https://example.supabase.co/functions/v1/agent-memory-api",
      OB1_AGENT_MEMORY_KEY: "fake-key",
      OB1_AGENT_MEMORY_WORKSPACE_ID: "workspace-1",
      OB1_AGENT_MEMORY_PROJECT_ID: "project-1",
    }),
    /AGENT_MEMORY_ALLOW_QUERY_KEY/,
  );
});

test("buildChecks includes expected health/auth/read/write assertions", () => {
  const checks = buildChecks({
    workspaceId: "humestone-agent-memory-staging",
    projectId: "phase-8c-readonly-smoke",
  });

  const ids = checks.map((check) => check.id);
  assert.deepEqual(ids, [
    "health_missing_key",
    "health_invalid_key",
    "health_valid_key",
    "health_valid_bearer",
    "health_query_key_not_used",
    "memories_empty_state",
    "memories_workspace_not_allowed",
    "memories_project_not_allowed",
    "review_queue_empty_state",
    "memory_not_found",
    "recall_trace_not_found",
    "recall_write_blocked",
    "writeback_write_blocked",
    "usage_write_blocked",
    "review_write_blocked",
  ]);

  const blockedChecks = checks.filter((check) => check.id.endsWith("_write_blocked"));
  assert.equal(blockedChecks.length, 4);
  for (const blocked of blockedChecks) {
    assert.equal(blocked.expectedStatus, 403);
    assert.equal(blocked.expectedError, "read_only_mode");
  }

  const queryKeyCheck = checks.find((check) => check.id === "health_query_key_not_used");
  assert.equal(queryKeyCheck.queryKey, true);
  assert.equal(queryKeyCheck.displayPath, "/health?key=<redacted>");
});
