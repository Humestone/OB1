import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function source(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
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
