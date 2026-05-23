#!/usr/bin/env node

import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
export const NONEXISTENT_TRACE_ID = "phase-8c-readonly-smoke-nonexistent";

export function isTruthy(value) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

export function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  if (args.has("--help") || args.has("-h")) {
    return { help: true, execute: false };
  }
  return {
    help: false,
    execute: args.has("--execute"),
  };
}

export function buildHarnessConfig(options = {}, env = process.env) {
  const execute = options.execute === true;
  const endpoint = env.OB1_AGENT_MEMORY_ENDPOINT?.replace(/\/$/, "") ||
    "https://<staging-project-ref>.supabase.co/functions/v1/agent-memory-api";
  const accessKey = env.OB1_AGENT_MEMORY_KEY || env.MCP_ACCESS_KEY || "";
  const workspaceId = env.OB1_AGENT_MEMORY_WORKSPACE_ID || "humestone-agent-memory-staging";
  const projectId = env.OB1_AGENT_MEMORY_PROJECT_ID || "phase-8c-readonly-smoke";
  const outOfScopeWorkspaceId = env.OB1_AGENT_MEMORY_OUT_OF_SCOPE_WORKSPACE_ID || `${workspaceId}-out-of-scope`;
  const outOfScopeProjectId = env.OB1_AGENT_MEMORY_OUT_OF_SCOPE_PROJECT_ID || `${projectId}-out-of-scope`;

  if (!execute) {
    return { execute, endpoint, accessKey, workspaceId, projectId, outOfScopeWorkspaceId, outOfScopeProjectId };
  }

  if (!isTruthy(env.AGENT_MEMORY_READ_ONLY)) {
    throw new Error("Live execution is blocked unless AGENT_MEMORY_READ_ONLY=true.");
  }
  if (env.AGENT_MEMORY_ALLOW_QUERY_KEY && isTruthy(env.AGENT_MEMORY_ALLOW_QUERY_KEY)) {
    throw new Error("Live execution is blocked when AGENT_MEMORY_ALLOW_QUERY_KEY is enabled.");
  }
  if (env.AGENT_MEMORY_ALLOWED_WORKSPACE_ID !== workspaceId) {
    throw new Error("Set AGENT_MEMORY_ALLOWED_WORKSPACE_ID to match OB1_AGENT_MEMORY_WORKSPACE_ID for --execute.");
  }
  if (env.AGENT_MEMORY_ALLOWED_PROJECT_ID !== projectId) {
    throw new Error("Set AGENT_MEMORY_ALLOWED_PROJECT_ID to match OB1_AGENT_MEMORY_PROJECT_ID for --execute.");
  }
  if (!env.OB1_AGENT_MEMORY_ENDPOINT) {
    throw new Error("Set OB1_AGENT_MEMORY_ENDPOINT for --execute.");
  }
  if (!accessKey) {
    throw new Error("Set OB1_AGENT_MEMORY_KEY or MCP_ACCESS_KEY for --execute.");
  }

  return { execute, endpoint, accessKey, workspaceId, projectId, outOfScopeWorkspaceId, outOfScopeProjectId };
}

export function buildChecks(config) {
  const readQuery = new URLSearchParams({
    workspace_id: config.workspaceId,
    project_id: config.projectId,
  });
  const readQueryWithLimit = new URLSearchParams({
    workspace_id: config.workspaceId,
    project_id: config.projectId,
    limit: "20",
  });

  return [
    {
      id: "health_missing_key",
      method: "GET",
      path: "/health",
      auth: "none",
      expectedStatus: 401,
      expectedError: "Invalid or missing access key",
    },
    {
      id: "health_invalid_key",
      method: "GET",
      path: "/health",
      auth: "invalid",
      expectedStatus: 401,
      expectedError: "Invalid or missing access key",
    },
    {
      id: "health_valid_key",
      method: "GET",
      path: "/health",
      auth: "valid",
      expectedStatus: 200,
      expectedFields: {
        ok: true,
        service: "agent-memory-api",
      },
    },
    {
      id: "health_valid_bearer",
      method: "GET",
      path: "/health",
      auth: "valid_bearer",
      expectedStatus: 200,
      expectedFields: {
        ok: true,
        service: "agent-memory-api",
      },
    },
    {
      id: "health_query_key_not_used",
      method: "GET",
      path: "/health",
      queryKey: true,
      displayPath: "/health?key=<redacted>",
      auth: "none",
      expectedStatus: 401,
      expectedError: "Invalid or missing access key",
      note: "Production verification must use headers, not ?key= URLs.",
    },
    {
      id: "memories_empty_state",
      method: "GET",
      path: `/memories?${readQueryWithLimit.toString()}`,
      auth: "valid",
      expectedStatus: 200,
      expectsEmptyMemories: true,
    },
    {
      id: "memories_workspace_not_allowed",
      method: "GET",
      path: `/memories?${new URLSearchParams({
        workspace_id: config.outOfScopeWorkspaceId,
        project_id: config.projectId,
        limit: "20",
      }).toString()}`,
      auth: "valid",
      expectedStatus: 403,
      expectedError: "scope_not_allowed",
    },
    {
      id: "memories_project_not_allowed",
      method: "GET",
      path: `/memories?${new URLSearchParams({
        workspace_id: config.workspaceId,
        project_id: config.outOfScopeProjectId,
        limit: "20",
      }).toString()}`,
      auth: "valid",
      expectedStatus: 403,
      expectedError: "scope_not_allowed",
    },
    {
      id: "review_queue_empty_state",
      method: "GET",
      path: `/memories/review?${readQuery.toString()}`,
      auth: "valid",
      expectedStatus: 200,
      expectsEmptyMemories: true,
    },
    {
      id: "memory_not_found",
      method: "GET",
      path: `/memories/${ZERO_UUID}`,
      auth: "valid",
      expectedStatus: 404,
    },
    {
      id: "recall_trace_not_found",
      method: "GET",
      path: `/recall-traces/${NONEXISTENT_TRACE_ID}`,
      auth: "valid",
      expectedStatus: 404,
    },
    {
      id: "recall_write_blocked",
      method: "POST",
      path: "/recall",
      auth: "valid",
      expectedStatus: 403,
      expectedError: "read_only_mode",
      body: {},
    },
    {
      id: "writeback_write_blocked",
      method: "POST",
      path: "/writeback",
      auth: "valid",
      expectedStatus: 403,
      expectedError: "read_only_mode",
      body: {},
    },
    {
      id: "usage_write_blocked",
      method: "POST",
      path: `/recall/${NONEXISTENT_TRACE_ID}/usage`,
      auth: "valid",
      expectedStatus: 403,
      expectedError: "read_only_mode",
      body: {},
    },
    {
      id: "review_write_blocked",
      method: "PATCH",
      path: `/memories/${ZERO_UUID}/review`,
      auth: "valid",
      expectedStatus: 403,
      expectedError: "read_only_mode",
      body: {},
    },
  ];
}

function makeHeaders(authMode, key) {
  const headers = {
    "content-type": "application/json",
  };
  if (authMode === "valid") {
    headers["x-brain-key"] = key;
  } else if (authMode === "valid_bearer") {
    headers.authorization = `Bearer ${key}`;
  } else if (authMode === "invalid") {
    headers["x-brain-key"] = "phase-8c-invalid-key";
  }
  return headers;
}

function validateResult(check, payload) {
  if (check.expectedError !== undefined) {
    if (payload.error !== check.expectedError) {
      throw new Error(`${check.id}: expected error=${check.expectedError}, got ${JSON.stringify(payload).slice(0, 400)}`);
    }
  }
  if (check.expectedFields) {
    for (const [field, expected] of Object.entries(check.expectedFields)) {
      if (payload[field] !== expected) {
        throw new Error(`${check.id}: expected ${field}=${JSON.stringify(expected)}, got ${JSON.stringify(payload[field])}`);
      }
    }
  }
  if (check.expectsEmptyMemories) {
    if (!Array.isArray(payload.memories)) {
      throw new Error(`${check.id}: expected memories array in response.`);
    }
    if (payload.memories.length !== 0) {
      throw new Error(`${check.id}: expected empty memories array, got ${payload.memories.length}.`);
    }
    if (typeof payload.count === "number" && payload.count !== 0) {
      throw new Error(`${check.id}: expected count=0, got ${payload.count}.`);
    }
  }
}

async function runCheck(config, check) {
  const path = check.queryKey
    ? `${check.path}?key=${encodeURIComponent(config.accessKey)}`
    : check.path;
  const displayPath = check.displayPath || check.path;
  const response = await fetch(`${config.endpoint}${path}`, {
    method: check.method,
    headers: makeHeaders(check.auth, config.accessKey),
    body: check.body === undefined ? undefined : JSON.stringify(check.body),
  });
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (response.status !== check.expectedStatus) {
    throw new Error(`${check.id}: expected status ${check.expectedStatus}, got ${response.status}. body=${JSON.stringify(payload).slice(0, 600)}`);
  }

  validateResult(check, payload);
  return {
    id: check.id,
    method: check.method,
    path: displayPath,
    status: response.status,
    ok: true,
  };
}

function buildDryRunSummary(config, checks) {
  return {
    ok: true,
    mode: "dry-run",
    endpoint: config.endpoint,
    workspace_id: config.workspaceId,
    project_id: config.projectId,
    checks: checks.map((check) => ({
      id: check.id,
      method: check.method,
      path: check.displayPath || check.path,
      expected_status: check.expectedStatus,
      auth: check.auth,
      expected_error: check.expectedError || null,
    })),
    notes: [
      "No network calls were made.",
      "This harness never invokes the stock write-heavy live-smoke script.",
      "Live execution is blocked unless read-only mode and workspace/project allowlists are explicit.",
      "Live execution uses header auth and refuses AGENT_MEMORY_ALLOW_QUERY_KEY=true.",
      "When executed, write probes use empty payloads and must return read_only_mode=403.",
    ],
  };
}

function printHelp() {
  console.log(`Usage:
  node integrations/agent-memory-api/smoke/read-only-smoke.mjs [--execute]

Defaults to dry-run mode with no network calls.
Use --execute only after explicit approval for live staging read-only smoke.

Required for --execute:
  AGENT_MEMORY_READ_ONLY=true
  AGENT_MEMORY_ALLOWED_WORKSPACE_ID=<same as OB1_AGENT_MEMORY_WORKSPACE_ID>
  AGENT_MEMORY_ALLOWED_PROJECT_ID=<same as OB1_AGENT_MEMORY_PROJECT_ID>
  OB1_AGENT_MEMORY_ENDPOINT=https://<project>.supabase.co/functions/v1/agent-memory-api
  OB1_AGENT_MEMORY_KEY=<staging key>   (or MCP_ACCESS_KEY)

Optional:
  OB1_AGENT_MEMORY_WORKSPACE_ID=humestone-agent-memory-staging
  OB1_AGENT_MEMORY_PROJECT_ID=phase-8c-readonly-smoke
  OB1_AGENT_MEMORY_OUT_OF_SCOPE_WORKSPACE_ID=<workspace expected to return 403>
  OB1_AGENT_MEMORY_OUT_OF_SCOPE_PROJECT_ID=<project expected to return 403>
`);
}

export async function runCli(argv = process.argv, env = process.env) {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    printHelp();
    return { ok: true, mode: "help" };
  }

  const config = buildHarnessConfig(parsed, env);
  const checks = buildChecks(config);

  if (!config.execute) {
    const summary = buildDryRunSummary(config, checks);
    console.log(JSON.stringify(summary, null, 2));
    return summary;
  }

  const results = [];
  for (const check of checks) {
    const result = await runCheck(config, check);
    results.push(result);
  }

  const summary = {
    ok: true,
    mode: "execute",
    endpoint: config.endpoint,
    workspace_id: config.workspaceId,
    project_id: config.projectId,
    total_checks: results.length,
    checks: results,
  };
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isEntrypoint) {
  runCli().catch((error) => {
    console.error(JSON.stringify({
      ok: false,
      error: error?.message || String(error),
    }, null, 2));
    process.exit(1);
  });
}
