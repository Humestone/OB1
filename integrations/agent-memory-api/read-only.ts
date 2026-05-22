export const READ_ONLY_ERROR = {
  error: "read_only_mode",
  message: "Agent Memory API is read-only for this environment.",
};

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

const WRITE_ENDPOINTS = new Set([
  "POST /recall",
  "POST /writeback",
  "POST /recall/:request_id/usage",
  "PATCH /memories/:id/review",
]);

export function parseBooleanEnv(value: string | undefined): boolean {
  if (!value) return false;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

export function readOnlyEnabledFromEnv(value = Deno.env.get("AGENT_MEMORY_READ_ONLY")): boolean {
  return parseBooleanEnv(value);
}

export function shouldBlockWriteEndpoint(method: string, endpointPattern: string, readOnlyEnabled: boolean): boolean {
  if (!readOnlyEnabled) return false;
  return WRITE_ENDPOINTS.has(`${method.toUpperCase()} ${endpointPattern}`);
}
