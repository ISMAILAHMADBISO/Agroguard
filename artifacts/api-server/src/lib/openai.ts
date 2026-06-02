/**
 * OpenAI client — uses the user-provided OPENAI_API_KEY secret.
 * Instantiated lazily so a missing key surfaces as a handled 503 in the AI
 * routes rather than crashing the whole server at boot.
 */
import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (client) return client;
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  client = new OpenAI({ apiKey });
  return client;
}

/** Model used for both vision (disease detection) and advisory chat. */
export const AI_MODEL = "gpt-4o";
