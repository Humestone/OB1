import { assert, assertEquals, assertFalse } from "jsr:@std/assert@1";

import { app, configureAgentMemoryAppForTest } from "./index.ts";

const ACCESS_KEY = "local-test-access-key";
const WORKSPACE_ID = "workspace-11111111-1111-4111-8111-111111111111";
const OTHER_WORKSPACE_ID = "workspace-22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "project-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_PROJECT_ID = "project-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const MEMORY_ID = "11111111-2222-4333-8444-555555555555";
const TRACE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const REQUEST_ID = "99999999-8888-4777-8666-555555555555";

type Row = Record<string, unknown>;

class FakeQuery {
  #rows: Row[];
  #filters: Array<[string, unknown]> = [];
  #limit: number | null = null;

  constructor(rows: Row[]) {
    this.#rows = rows;
  }

  select(_columns?: string) {
    return this;
  }

  eq(column: string, value: unknown) {
    this.#filters.push([column, value]);
    return this;
  }

  order(_column: string, _options?: Record<string, unknown>) {
    return this;
  }

  limit(limit: number) {
    this.#limit = limit;
    return this;
  }

  insert(_row: unknown) {
    return this;
  }

  update(_row: unknown) {
    return this;
  }

  in(_column: string, _values: unknown[]) {
    return this;
  }

  like(_column: string, _pattern: string) {
    return this;
  }

  #resultRows() {
    let rows = this.#rows.filter((row) =>
      this.#filters.every(([column, value]) => row[column] === value)
    );
    if (this.#limit !== null) rows = rows.slice(0, this.#limit);
    return rows;
  }

  then(
    resolve: (value: { data: Row[]; error: null }) => unknown,
    _reject?: (reason?: unknown) => unknown,
  ) {
    return Promise.resolve(resolve({ data: this.#resultRows(), error: null }));
  }

  single() {
    const [row] = this.#resultRows();
    if (!row) {
      return Promise.resolve({
        data: null,
        error: { message: "No rows found" },
      });
    }
    return Promise.resolve({ data: row, error: null });
  }

  maybeSingle() {
    const [row] = this.#resultRows();
    return Promise.resolve({ data: row ?? null, error: null });
  }
}

function memory(overrides: Partial<Row> = {}): Row {
  return {
    id: MEMORY_ID,
    thought_id: "thought-11111111-1111-4111-8111-111111111111",
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    channel_id: "channel-11111111-1111-4111-8111-111111111111",
    visibility: "project",
    memory_type: "decision",
    summary: "in-scope synthetic summary",
    content: "in-scope synthetic content",
    lifecycle_status: "active",
    provenance_status: "user_confirmed",
    confidence: 0.98,
    created_by: "agent",
    runtime_name: "local-scope-test",
    runtime_version: "0.0.0",
    provider: "synthetic-provider",
    model: "synthetic-model",
    task_id: "task-11111111-1111-4111-8111-111111111111",
    flow_id: null,
    can_use_as_instruction: true,
    can_use_as_evidence: true,
    requires_user_confirmation: false,
    review_status: "confirmed",
    last_confirmed_at: "2026-05-22T12:00:00.000Z",
    stale_after: null,
    created_at: "2026-05-22T12:00:00.000Z",
    metadata: {
      source_refs: [{ kind: "synthetic-note", uri: "fixture:in-scope-source" }],
      artifacts: [{ kind: "synthetic-doc", uri: "fixture:in-scope-artifact" }],
    },
    agent_memory_source_refs: [{
      source_kind: "synthetic-note",
      uri: "fixture:in-scope-source",
    }],
    agent_memory_artifacts: [{
      artifact_kind: "synthetic-doc",
      uri: "fixture:in-scope-artifact",
    }],
    ...overrides,
  };
}

function trace(overrides: Partial<Row> = {}): Row {
  return {
    id: TRACE_ID,
    request_id: REQUEST_ID,
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    runtime_name: "local-scope-test",
    task_id: "task-11111111-1111-4111-8111-111111111111",
    request_payload: {
      query: "synthetic in-scope request",
    },
    response_policy: {
      max_items: 10,
    },
    ...overrides,
  };
}

function makeFakeSupabase(options: {
  memories?: Row[];
  traces?: Row[];
  items?: Row[];
} = {}) {
  const calls: string[] = [];
  const tables: Record<string, Row[]> = {
    agent_memories: options.memories ?? [],
    agent_memory_recall_traces: options.traces ?? [],
    agent_memory_recall_items: options.items ?? [],
    agent_memory_audit_events: [],
  };

  return {
    calls,
    client: {
      from(table: string) {
        calls.push(table);
        return new FakeQuery(tables[table] ?? []);
      },
      rpc(fn: string) {
        calls.push(`rpc:${fn}`);
        return Promise.resolve({ data: [], error: null });
      },
    },
  };
}

function configure(
  fake = makeFakeSupabase(),
  options: boolean | {
    readOnly?: boolean;
    allowQueryKey?: boolean;
    allowedScope?: {
      workspace_id?: string | null;
      project_id?: string | null;
    };
  } = {},
) {
  const runtime = typeof options === "boolean"
    ? { readOnly: options }
    : options;
  configureAgentMemoryAppForTest({
    supabase: fake.client,
    mcpAccessKey: ACCESS_KEY,
    readOnly: runtime.readOnly ?? false,
    allowQueryKey: runtime.allowQueryKey ?? false,
    allowedScope: runtime.allowedScope ?? {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
    },
  });
  return fake;
}

function authed(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-brain-key", ACCESS_KEY);
  return app.request(
    path,
    { ...init, headers } as Parameters<typeof app.request>[1],
  );
}

function assertNoLeak(text: string, forbidden: string[]) {
  for (const value of forbidden) {
    assertFalse(
      text.includes(value),
      `response leaked forbidden fixture value: ${value}`,
    );
  }
}

Deno.test("route middleware accepts Bearer auth but keeps query-key auth opt-in", async () => {
  configure();

  const bearerResponse = await app.request("/health", {
    headers: { authorization: `Bearer ${ACCESS_KEY}` },
  });
  const rejectedQueryResponse = await app.request(`/health?key=${ACCESS_KEY}`);

  configure(makeFakeSupabase(), { allowQueryKey: true });
  const acceptedQueryResponse = await app.request(`/health?key=${ACCESS_KEY}`);

  assertEquals(bearerResponse.status, 200);
  assertEquals(rejectedQueryResponse.status, 401);
  assertEquals(acceptedQueryResponse.status, 200);
});

Deno.test("GET /memories/:id returns in-scope real-ID-shaped memory detail", async () => {
  configure(makeFakeSupabase({ memories: [memory()] }));

  const response = await authed(
    `/memories/${MEMORY_ID}?workspace_id=${WORKSPACE_ID}&project_id=${PROJECT_ID}`,
  );
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.memory.id, MEMORY_ID);
  assertEquals(body.memory.workspace_id, WORKSPACE_ID);
  assertEquals(body.memory.project_id, PROJECT_ID);
  assertEquals(body.memory.content, "in-scope synthetic content");
});

Deno.test("GET detail routes apply configured scope when request omits scope query params", async () => {
  configure(makeFakeSupabase({
    memories: [memory()],
    traces: [trace()],
    items: [{ trace_id: TRACE_ID, rank: 1, agent_memories: memory() }],
  }));

  const memoryResponse = await authed(`/memories/${MEMORY_ID}`);
  const traceResponse = await authed(`/recall-traces/${REQUEST_ID}`);

  assertEquals(memoryResponse.status, 200);
  assertEquals(traceResponse.status, 200);

  configure(makeFakeSupabase({
    memories: [
      memory({
        project_id: OTHER_PROJECT_ID,
        summary: "default-scope wrong-project summary",
        content: "default-scope wrong-project content",
      }),
    ],
    traces: [
      trace({
        project_id: OTHER_PROJECT_ID,
        request_payload: { query: "default-scope wrong-project trace" },
      }),
    ],
  }));

  const deniedMemoryResponse = await authed(`/memories/${MEMORY_ID}`);
  const deniedTraceResponse = await authed(`/recall-traces/${REQUEST_ID}`);
  const denialText = `${await deniedMemoryResponse
    .text()}\n${await deniedTraceResponse
    .text()}`;

  assertEquals(deniedMemoryResponse.status, 404);
  assertEquals(deniedTraceResponse.status, 404);
  assertNoLeak(denialText, [
    "default-scope wrong-project summary",
    "default-scope wrong-project content",
    "default-scope wrong-project trace",
    OTHER_PROJECT_ID,
  ]);
});

Deno.test("GET /memories/:id hides wrong-workspace memory without content leakage", async () => {
  configure(makeFakeSupabase({
    memories: [
      memory({
        workspace_id: OTHER_WORKSPACE_ID,
        summary: "out-of-scope workspace summary",
        content: "out-of-scope workspace content",
        metadata: { source_refs: [{ uri: "fixture:wrong-workspace-source" }] },
      }),
    ],
  }));

  const response = await authed(
    `/memories/${MEMORY_ID}?workspace_id=${WORKSPACE_ID}&project_id=${PROJECT_ID}`,
  );
  const text = await response.text();

  assertEquals(response.status, 404);
  assertNoLeak(text, [
    "out-of-scope workspace summary",
    "out-of-scope workspace content",
    "fixture:wrong-workspace-source",
    OTHER_WORKSPACE_ID,
  ]);
});

Deno.test("GET /memories/:id hides wrong-project memory without content leakage", async () => {
  configure(makeFakeSupabase({
    memories: [
      memory({
        project_id: OTHER_PROJECT_ID,
        summary: "out-of-scope project summary",
        content: "out-of-scope project content",
        metadata: { artifacts: [{ uri: "fixture:wrong-project-artifact" }] },
      }),
    ],
  }));

  const response = await authed(
    `/memories/${MEMORY_ID}?workspace_id=${WORKSPACE_ID}&project_id=${PROJECT_ID}`,
  );
  const text = await response.text();

  assertEquals(response.status, 404);
  assertNoLeak(text, [
    "out-of-scope project summary",
    "out-of-scope project content",
    "fixture:wrong-project-artifact",
    OTHER_PROJECT_ID,
  ]);
});

Deno.test("GET /recall-traces/:request_id returns in-scope trace detail", async () => {
  configure(makeFakeSupabase({
    traces: [trace()],
    items: [{ trace_id: TRACE_ID, rank: 1, agent_memories: memory() }],
  }));

  const response = await authed(
    `/recall-traces/${REQUEST_ID}?workspace_id=${WORKSPACE_ID}&project_id=${PROJECT_ID}`,
  );
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.trace.request_id, REQUEST_ID);
  assertEquals(body.trace.workspace_id, WORKSPACE_ID);
  assertEquals(body.trace.project_id, PROJECT_ID);
  assertEquals(body.items.length, 1);
});

Deno.test("GET /recall-traces/:request_id hides wrong-workspace trace without payload leakage", async () => {
  configure(makeFakeSupabase({
    traces: [
      trace({
        workspace_id: OTHER_WORKSPACE_ID,
        request_payload: { query: "out-of-scope workspace trace query" },
      }),
    ],
  }));

  const response = await authed(
    `/recall-traces/${REQUEST_ID}?workspace_id=${WORKSPACE_ID}&project_id=${PROJECT_ID}`,
  );
  const text = await response.text();

  assertEquals(response.status, 404);
  assertNoLeak(text, [
    "out-of-scope workspace trace query",
    OTHER_WORKSPACE_ID,
  ]);
});

Deno.test("GET /recall-traces/:request_id hides wrong-project trace without payload leakage", async () => {
  configure(makeFakeSupabase({
    traces: [
      trace({
        project_id: OTHER_PROJECT_ID,
        request_payload: { query: "out-of-scope project trace query" },
      }),
    ],
  }));

  const response = await authed(
    `/recall-traces/${REQUEST_ID}?workspace_id=${WORKSPACE_ID}&project_id=${PROJECT_ID}`,
  );
  const text = await response.text();

  assertEquals(response.status, 404);
  assertNoLeak(text, [
    "out-of-scope project trace query",
    OTHER_PROJECT_ID,
  ]);
});

Deno.test("GET /recall-traces/:request_id filters nested mixed-scope trace items", async () => {
  const orphanedMemoryId = "44444444-5555-4666-8777-888888888888";
  configure(makeFakeSupabase({
    traces: [trace()],
    items: [
      {
        trace_id: TRACE_ID,
        rank: 1,
        agent_memories: memory({ content: "nested in-scope content" }),
      },
      {
        trace_id: TRACE_ID,
        rank: 2,
        agent_memories: memory({
          id: "22222222-3333-4444-8555-666666666666",
          project_id: OTHER_PROJECT_ID,
          summary: "nested out-of-scope summary",
          content: "nested out-of-scope content",
          metadata: {
            artifacts: [{ uri: "fixture:nested-out-of-scope-artifact" }],
          },
        }),
      },
      {
        trace_id: TRACE_ID,
        rank: 3,
        agent_memories: memory({
          id: "33333333-4444-4555-8666-777777777777",
          workspace_id: OTHER_WORKSPACE_ID,
          summary: "nested other-workspace summary",
          content: "nested other-workspace content",
          metadata: {
            source_refs: [{ uri: "fixture:nested-other-workspace-source" }],
          },
        }),
      },
      {
        trace_id: TRACE_ID,
        memory_id: orphanedMemoryId,
        rank: 4,
        agent_memories: null,
      },
    ],
  }));

  const response = await authed(
    `/recall-traces/${REQUEST_ID}?workspace_id=${WORKSPACE_ID}&project_id=${PROJECT_ID}`,
  );
  const text = await response.text();
  const body = JSON.parse(text);

  assertEquals(response.status, 200);
  assertEquals(body.items.length, 1);
  assertEquals(body.items[0].agent_memories.content, "nested in-scope content");
  assertNoLeak(text, [
    "nested out-of-scope summary",
    "nested out-of-scope content",
    "fixture:nested-out-of-scope-artifact",
    "nested other-workspace summary",
    "nested other-workspace content",
    "fixture:nested-other-workspace-source",
    orphanedMemoryId,
    OTHER_PROJECT_ID,
    OTHER_WORKSPACE_ID,
  ]);
});

Deno.test("read-only mode blocks write routes before payload validation or database access", async () => {
  const fake = configure(makeFakeSupabase(), true);
  const writeRoutes: Array<[string, string]> = [
    ["POST", "/recall"],
    ["POST", "/writeback"],
    ["POST", `/recall/${REQUEST_ID}/usage`],
    ["PATCH", `/memories/${MEMORY_ID}/review`],
  ];

  for (const [method, path] of writeRoutes) {
    fake.calls.length = 0;
    const response = await authed(path, {
      method,
      body: "{",
      headers: { "content-type": "application/json" },
    });
    const text = await response.text();

    assertEquals(response.status, 403, `${method} ${path}`);
    assertEquals(JSON.parse(text).error, "read_only_mode");
    assertEquals(
      fake.calls,
      [],
      `${method} ${path} should not reach database access`,
    );
    assertNoLeak(text, [
      "Invalid recall payload",
      "Invalid write-back payload",
      "Invalid usage payload",
      "Invalid review payload",
    ]);
  }
});

Deno.test("PATCH /memories/:id/review rejects out-of-scope merge relation before side effects", async () => {
  const relatedMemoryId = "55555555-6666-4777-8888-999999999999";
  const fake = configure(makeFakeSupabase({
    memories: [
      memory(),
      memory({
        id: relatedMemoryId,
        project_id: OTHER_PROJECT_ID,
        summary: "out-of-scope merge target summary",
        content: "out-of-scope merge target content",
      }),
    ],
  }));

  const response = await authed(`/memories/${MEMORY_ID}/review`, {
    method: "PATCH",
    body: JSON.stringify({
      action: "merge",
      related_memory_id: relatedMemoryId,
    }),
    headers: { "content-type": "application/json" },
  });
  const text = await response.text();

  assertEquals(response.status, 403);
  assertFalse(fake.calls.includes("agent_memory_relations"));
  assertFalse(fake.calls.includes("agent_memory_review_actions"));
  assertNoLeak(text, [
    relatedMemoryId,
    "out-of-scope merge target summary",
    "out-of-scope merge target content",
  ]);
});

Deno.test("denial bodies avoid synthetic out-of-scope details and source metadata", async () => {
  configure(makeFakeSupabase({
    memories: [
      memory({
        workspace_id: OTHER_WORKSPACE_ID,
        project_id: OTHER_PROJECT_ID,
        summary: "denied synthetic summary",
        content: "denied synthetic content",
        metadata: {
          source_refs: [{ uri: "fixture:denied-source-ref" }],
          artifacts: [{ uri: "fixture:denied-artifact" }],
          note: "denied metadata note",
        },
      }),
    ],
    traces: [
      trace({
        workspace_id: OTHER_WORKSPACE_ID,
        project_id: OTHER_PROJECT_ID,
        request_payload: { query: "denied trace request payload" },
        response_policy: { note: "denied trace metadata" },
      }),
    ],
  }));

  const memoryResponse = await authed(
    `/memories/${MEMORY_ID}?workspace_id=${WORKSPACE_ID}&project_id=${PROJECT_ID}`,
  );
  const traceResponse = await authed(
    `/recall-traces/${REQUEST_ID}?workspace_id=${WORKSPACE_ID}&project_id=${PROJECT_ID}`,
  );
  const denialText = `${await memoryResponse.text()}\n${await traceResponse
    .text()}`;

  assertEquals(memoryResponse.status, 404);
  assertEquals(traceResponse.status, 404);
  assertNoLeak(denialText, [
    "denied synthetic summary",
    "denied synthetic content",
    "fixture:denied-source-ref",
    "fixture:denied-artifact",
    "denied metadata note",
    "denied trace request payload",
    "denied trace metadata",
    OTHER_WORKSPACE_ID,
    OTHER_PROJECT_ID,
  ]);
  assert(denialText.includes("No rows found"));
});
