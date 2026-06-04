/**
 * Extracts a human-readable message from an API error.
 *
 * The generated client throws an `ApiError` whose `data` holds the JSON body
 * (e.g. `{ error: "AI is not configured. ..." }`). We surface that server
 * message to the user when present, falling back to the error message or a
 * provided default.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { data?: unknown } | null)?.data;
  if (data && typeof data === "object" && "error" in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
