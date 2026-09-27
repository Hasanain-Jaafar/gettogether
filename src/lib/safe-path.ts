/**
 * Returns `value` only if it's a same-site path ("/u/123?view=x"), so a
 * user-supplied return address can't redirect off-site ("//evil.com", "https://…").
 */
export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
