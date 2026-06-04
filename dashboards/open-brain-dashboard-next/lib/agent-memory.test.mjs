import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const root = process.cwd();

function source(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function runFormatDateInTimezone(timeZone) {
  const script = ts.transpileModule(
    `${source("lib/format.ts")}

console.log(JSON.stringify({
  full: formatDate("2026-01-15T02:30:00.000Z"),
  short: formatDateShort("2026-01-15T02:30:00.000Z"),
}));
`,
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;

  const result = spawnSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    env: { ...process.env, TZ: timeZone },
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("Agent Memory list and detail server actions exit before review mutation in read-only mode", () => {
  for (const file of [
    "app/agent-memory/page.tsx",
    "app/agent-memory/[id]/page.tsx",
  ]) {
    const text = source(file);
    const guardIndex = text.indexOf("if (isGovernanceReadOnly())");
    const mutationIndex = text.indexOf("reviewAgentMemory(");
    assert.notEqual(guardIndex, -1, `${file} must check governance read-only mode`);
    assert.notEqual(mutationIndex, -1, `${file} must contain reviewAgentMemory call`);
    assert.ok(guardIndex < mutationIndex, `${file} must guard before reviewAgentMemory`);
    assert.match(text, /governanceReadOnly \? \(/, `${file} must hide review controls in read-only mode`);
  }
});

test("Agent Memory API URL prefers explicit Agent Memory endpoint before derived fallback", () => {
  const text = source("lib/agent-memory.ts");
  assert.ok(
    text.indexOf("process.env.AGENT_MEMORY_API_URL") < text.indexOf("deriveAgentMemoryUrl"),
    "AGENT_MEMORY_API_URL must be checked before derived fallback",
  );
  assert.ok(
    text.indexOf("process.env.NEXT_PUBLIC_AGENT_MEMORY_API_URL") < text.indexOf("deriveAgentMemoryUrl"),
    "NEXT_PUBLIC_AGENT_MEMORY_API_URL must be checked before derived fallback",
  );
});

test("Agent Memory ID reads carry dashboard workspace and project scope", () => {
  const library = source("lib/agent-memory.ts");
  assert.match(library, /fetchAgentMemory\(\s*apiKey: string,\s*memoryId: string,\s*scope\?:/s);
  assert.match(library, /fetchRecallTrace\(\s*apiKey: string,\s*requestId: string,\s*scope\?:/s);
  assert.match(library, /sp\.set\("workspace_id", scope\.workspace_id\)/);
  assert.match(library, /sp\.set\("project_id", scope\.project_id\)/);

  const detailPage = source("app/agent-memory/[id]/page.tsx");
  assert.match(detailPage, /const defaults = agentMemoryDefaults\(\)/);
  assert.match(detailPage, /const workspaceId = query\.workspace_id \|\| defaults\.workspaceId/);
  assert.match(detailPage, /fetchAgentMemory\(apiKey, id, \{\s*workspace_id: workspaceId,\s*project_id: projectId,/s);

  const tracesPage = source("app/agent-memory/traces/page.tsx");
  assert.match(tracesPage, /const defaults = agentMemoryDefaults\(\)/);
  assert.match(tracesPage, /const workspaceId = params\.workspace_id \|\| defaults\.workspaceId/);
  assert.match(tracesPage, /fetchRecallTrace\(apiKey, requestId, \{\s*workspace_id: workspaceId,\s*project_id: projectId,/s);
  assert.match(tracesPage, /<input type="hidden" name="workspace_id" value=\{workspaceId\} \/>/);

  const listPage = source("app/agent-memory/page.tsx");
  assert.match(listPage, /function scopedUrl\(path: string\)/);
  assert.match(listPage, /href=\{scopedUrl\(`\/agent-memory\/\$\{memory\.memory_id\}`\)\}/);
});

test("dashboard date formatting is stable across server and browser timezone differences", () => {
  const serverRender = runFormatDateInTimezone("UTC");
  const browserHydration = runFormatDateInTimezone("America/New_York");

  assert.deepEqual(browserHydration, serverRender);
  assert.deepEqual(serverRender, {
    full: "01/15/2026 02:30",
    short: "01/15/2026",
  });
});
