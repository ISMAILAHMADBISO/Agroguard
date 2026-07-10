/**
 * OpenAI client — uses the user-provided OPENAI_API_KEY secret.
 * Instantiated lazily so a missing key surfaces as a handled error in the AI
 * routes rather than crashing the whole server at boot.
 */
import OpenAI from "openai";

let client: OpenAI | null = null;

/** True when an OpenAI API key is configured. */
export function isAIConfigured(): boolean {
  return !!process.env["OPENAI_API_KEY"];
}

export function getOpenAI(): OpenAI {
  if (client) return client;
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const baseURL = process.env["OPENAI_BASE_URL"];
  client = new OpenAI({ apiKey, baseURL });
  return client;
}

/** Model used for both vision (disease detection) and advisory chat. */
export const AI_MODEL = process.env["AI_MODEL"] || "gpt-4o";

export interface AIErrorResult {
  status: number;
  message: string;
}

/**
 * Maps an OpenAI SDK error to a clear, user-facing message + HTTP status.
 *
 * The most common operational failure is an exhausted quota (HTTP 429 with
 * code "insufficient_quota") — the API key is valid but the OpenAI account has
 * no remaining credits/billing. We surface that explicitly so users fix the
 * billing rather than chasing a non-existent code bug. `fallback` is used for
 * any error we don't specifically recognise.
 */
export function describeAIError(err: unknown, fallback: string): AIErrorResult {
  const e = err as { status?: number; code?: string } | undefined;
  const status = e?.status;
  const code = e?.code;

  if (status === 429 && code === "insufficient_quota") {
    return {
      status: 402,
      message:
        "AI is temporarily unavailable: the OpenAI account for this key is out " +
        "of quota. Add credits or billing at platform.openai.com (Billing) to " +
        "re-enable disease detection and the advisory chat.",
    };
  }
  if (status === 429) {
    return {
      status: 429,
      message:
        "AI is busy right now (too many requests). Please wait a few seconds " +
        "and try again.",
    };
  }
  if (status === 401) {
    return {
      status: 502,
      message:
        "AI is unavailable: the OPENAI_API_KEY was rejected. Check that the key " +
        "is valid and active.",
    };
  }
  return { status: 502, message: fallback };
}
