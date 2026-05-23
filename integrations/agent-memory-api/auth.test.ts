import { assertEquals } from "jsr:@std/assert@1";

import { accessKeyMatches, parseBearerToken, selectAccessKey } from "./auth.ts";

function headers(values: Record<string, string>) {
  const normalized = new Map(
    Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    get(name: string) {
      return normalized.get(name.toLowerCase()) ?? null;
    },
  };
}

Deno.test("parseBearerToken accepts Authorization Bearer keys", () => {
  assertEquals(parseBearerToken("Bearer secret-key"), "secret-key");
  assertEquals(parseBearerToken("bearer secret-key"), "secret-key");
});

Deno.test("selectAccessKey prefers x-brain-key over Authorization Bearer", () => {
  assertEquals(
    selectAccessKey(
      headers({
        "x-brain-key": "header-key",
        authorization: "Bearer bearer-key",
      }),
      "https://example.test",
    ),
    "header-key",
  );
});

Deno.test("selectAccessKey accepts Authorization Bearer when x-brain-key is absent", () => {
  assertEquals(
    selectAccessKey(
      headers({ authorization: "Bearer bearer-key" }),
      "https://example.test",
    ),
    "bearer-key",
  );
});

Deno.test("selectAccessKey ignores query string keys unless explicitly allowed", () => {
  assertEquals(
    selectAccessKey(headers({}), "https://example.test?key=query-key"),
    undefined,
  );
  assertEquals(
    selectAccessKey(headers({}), "https://example.test?key=query-key", {
      allowQueryKey: true,
    }),
    "query-key",
  );
});

Deno.test("accessKeyMatches requires provided and expected keys to match", () => {
  assertEquals(accessKeyMatches("secret-key", "secret-key"), true);
  assertEquals(accessKeyMatches("secret-key", "other-key"), false);
  assertEquals(accessKeyMatches(undefined, "secret-key"), false);
});
