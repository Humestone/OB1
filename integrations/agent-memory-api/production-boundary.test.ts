import { assert, assertStringIncludes } from "jsr:@std/assert@1";

const source = await Deno.readTextFile("./index.ts");

Deno.test("index wires header/Bearer auth helper and keeps query-key auth opt-in", () => {
  assertStringIncludes(source, "selectAccessKey(c.req.raw.headers");
  assertStringIncludes(source, "AGENT_MEMORY_ALLOW_QUERY_KEY");
  assertStringIncludes(source, "accessKeyMatches(provided, MCP_ACCESS_KEY)");
});

Deno.test("index reads production scope allowlist env vars", () => {
  assertStringIncludes(source, "AGENT_MEMORY_ALLOWED_WORKSPACE_ID");
  assertStringIncludes(source, "AGENT_MEMORY_ALLOWED_PROJECT_ID");
});

Deno.test("index guards ID-based read routes before returning records", () => {
  const memoryRoute = source.indexOf('app.get("/memories/:id"');
  const traceRoute = source.indexOf('app.get("/recall-traces/:request_id"');
  assert(memoryRoute > -1, "memory ID route must exist");
  assert(traceRoute > -1, "recall trace ID route must exist");

  const memoryRouteBody = source.slice(memoryRoute, traceRoute);
  const traceRouteBody = source.slice(traceRoute);
  assertStringIncludes(memoryRouteBody, "scopeBlock(c, data");
  assertStringIncludes(traceRouteBody, "scopeBlock(c, trace");
});

Deno.test("index pushes requested or allowed scope into ID-based read queries", () => {
  const memoryRoute = source.indexOf('app.get("/memories/:id"');
  const traceRoute = source.indexOf('app.get("/recall-traces/:request_id"');
  const memoryRouteBody = source.slice(memoryRoute, traceRoute);
  const traceRouteBody = source.slice(traceRoute);

  assertStringIncludes(source, "function requestedOrAllowedScope");
  assertStringIncludes(
    memoryRouteBody,
    "const scope = requestedOrAllowedScope(c)",
  );
  assertStringIncludes(
    memoryRouteBody,
    'q = q.eq("workspace_id", scope.workspace_id)',
  );
  assertStringIncludes(
    memoryRouteBody,
    'q = q.eq("project_id", scope.project_id)',
  );
  assertStringIncludes(
    traceRouteBody,
    "const scope = requestedOrAllowedScope(c)",
  );
  assertStringIncludes(
    traceRouteBody,
    'q = q.eq("workspace_id", scope.workspace_id)',
  );
  assertStringIncludes(
    traceRouteBody,
    'q = q.eq("project_id", scope.project_id)',
  );
});

Deno.test("index scope-filters nested trace memories before returning trace items", () => {
  const traceRoute = source.indexOf('app.get("/recall-traces/:request_id"');
  const traceRouteBody = source.slice(traceRoute);

  assertStringIncludes(
    traceRouteBody,
    "const scopedItems = (items || []).filter",
  );
  assertStringIncludes(traceRouteBody, "const memory = item.agent_memories");
  assertStringIncludes(traceRouteBody, "scopeGuardViolation(memory");
  assertStringIncludes(
    traceRouteBody,
    "return c.json({ trace, items: scopedItems }",
  );
});

Deno.test("index validates related memory scope before review transition side effects", () => {
  const reviewRoute = source.indexOf('app.patch("/memories/:id/review"');
  const traceRoute = source.indexOf('app.get("/recall-traces/:request_id"');
  const reviewRouteBody = source.slice(reviewRoute, traceRoute);

  assertStringIncludes(reviewRouteBody, 'select("workspace_id, project_id")');
  assertStringIncludes(
    reviewRouteBody,
    "const relatedScopeDenied = allowedScopeBlock",
  );
  assertStringIncludes(
    reviewRouteBody,
    "if (relatedScopeDenied) return relatedScopeDenied",
  );
  assert(
    reviewRouteBody.indexOf("const relatedScopeDenied = allowedScopeBlock") <
      reviewRouteBody.indexOf(".update(updates)"),
    "related memory scope must be validated before primary memory updates",
  );
  assert(
    reviewRouteBody.indexOf("const relatedScopeDenied = allowedScopeBlock") <
      reviewRouteBody.indexOf('from("agent_memory_review_actions")'),
    "related memory scope must be validated before review action writes",
  );
  assert(
    reviewRouteBody.indexOf("const relatedScopeDenied = allowedScopeBlock") <
      reviewRouteBody.indexOf(".update(transition.relatedMemoryUpdates)"),
    "related memory scope must be validated before related memory updates",
  );
});
