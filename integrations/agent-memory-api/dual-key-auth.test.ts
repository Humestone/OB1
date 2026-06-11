import { assertEquals } from "jsr:@std/assert@1";
import { app, configureAgentMemoryAppForTest } from "./index.ts";

const NEW_KEY = "test-dedicated-agent-memory-key";
const OLD_KEY = "test-shared-mcp-key";

async function healthStatus(key?: string): Promise<number> {
  const headers: Record<string, string> = {};
  if (key) headers["x-brain-key"] = key;
  const res = await app.fetch(
    new Request("http://localhost/health", { headers }),
  );
  await res.body?.cancel();
  return res.status;
}

Deno.test("dual-key: new dedicated key accepted when set", async () => {
  configureAgentMemoryAppForTest({
    mcpAccessKey: OLD_KEY,
    agentMemoryAccessKey: NEW_KEY,
  });
  assertEquals(await healthStatus(NEW_KEY), 200);
});

Deno.test("dual-key: MCP_ACCESS_KEY fallback still accepted (D1 interim)", async () => {
  configureAgentMemoryAppForTest({
    mcpAccessKey: OLD_KEY,
    agentMemoryAccessKey: NEW_KEY,
  });
  assertEquals(await healthStatus(OLD_KEY), 200);
});

Deno.test("dual-key: wrong key rejected 401", async () => {
  configureAgentMemoryAppForTest({
    mcpAccessKey: OLD_KEY,
    agentMemoryAccessKey: NEW_KEY,
  });
  assertEquals(await healthStatus("wrong-key"), 401);
});

Deno.test("dual-key: missing key rejected 401", async () => {
  configureAgentMemoryAppForTest({
    mcpAccessKey: OLD_KEY,
    agentMemoryAccessKey: NEW_KEY,
  });
  assertEquals(await healthStatus(undefined), 401);
});

Deno.test("dual-key: unset dedicated key preserves MCP-only behavior", async () => {
  configureAgentMemoryAppForTest({
    mcpAccessKey: OLD_KEY,
    agentMemoryAccessKey: "",
  });
  assertEquals(await healthStatus(OLD_KEY), 200);
  assertEquals(await healthStatus(NEW_KEY), 401);
});
