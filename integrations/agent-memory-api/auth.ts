export function parseBearerToken(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || undefined;
}

export function selectAccessKey(
  headers: { get: (name: string) => string | null },
  url: string,
  options: { allowQueryKey?: boolean } = {},
): string | undefined {
  const headerKey = headers.get("x-brain-key")?.trim();
  if (headerKey) return headerKey;

  const bearerKey = parseBearerToken(headers.get("authorization") ?? undefined);
  if (bearerKey) return bearerKey;

  if (options.allowQueryKey) {
    return new URL(url).searchParams.get("key")?.trim() || undefined;
  }

  return undefined;
}

export function accessKeyMatches(
  provided: string | undefined,
  expected: string | undefined,
): boolean {
  return Boolean(provided && expected && provided === expected);
}
