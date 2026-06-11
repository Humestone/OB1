import { assertEquals } from "jsr:@std/assert@1";

import {
  parseBooleanEnv,
  READ_ONLY_ERROR,
  shouldBlockWriteEndpoint,
} from "./read-only.ts";

Deno.test("READ_ONLY_ERROR is runtime-neutral", () => {
  assertEquals(READ_ONLY_ERROR, {
    error: "read_only_mode",
    message: "Agent Memory API is read-only for this environment.",
  });
});

Deno.test("parseBooleanEnv recognizes truthy variants", () => {
  assertEquals(parseBooleanEnv("true"), true);
  assertEquals(parseBooleanEnv("TRUE"), true);
  assertEquals(parseBooleanEnv("1"), true);
  assertEquals(parseBooleanEnv(" yes "), true);
  assertEquals(parseBooleanEnv("on"), true);
});

Deno.test("parseBooleanEnv returns false for non-truthy values", () => {
  assertEquals(parseBooleanEnv(undefined), false);
  assertEquals(parseBooleanEnv(""), false);
  assertEquals(parseBooleanEnv("0"), false);
  assertEquals(parseBooleanEnv("false"), false);
  assertEquals(parseBooleanEnv("no"), false);
});

Deno.test("shouldBlockWriteEndpoint blocks all write routes in read-only mode", () => {
  assertEquals(shouldBlockWriteEndpoint("POST", "/recall", true), true);
  assertEquals(shouldBlockWriteEndpoint("POST", "/writeback", true), true);
  assertEquals(
    shouldBlockWriteEndpoint("POST", "/recall/:request_id/usage", true),
    true,
  );
  assertEquals(
    shouldBlockWriteEndpoint("PATCH", "/memories/:id/review", true),
    true,
  );
});

Deno.test("shouldBlockWriteEndpoint leaves read routes available", () => {
  assertEquals(shouldBlockWriteEndpoint("GET", "/health", true), false);
  assertEquals(shouldBlockWriteEndpoint("GET", "/memories", true), false);
  assertEquals(
    shouldBlockWriteEndpoint("GET", "/memories/review", true),
    false,
  );
  assertEquals(
    shouldBlockWriteEndpoint("GET", "/recall-traces/:request_id", true),
    false,
  );
  assertEquals(shouldBlockWriteEndpoint("POST", "/recall", false), false);
});
