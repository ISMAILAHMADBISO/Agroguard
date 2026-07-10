/**
 * AI routes — crop-disease detection (vision) and the farming-advisory chat.
 *
 * RBAC:
 *   - disease detection: any authenticated user; if a farmerId is supplied the
 *     caller must be able to access that farmer.
 *   - disease reports list: scoped by role (staff see assigned farmers' reports
 *     plus their own; farmers see only their own).
 *   - chat / conversations: strictly owner-scoped — a user only ever sees the
 *     conversations they created.
 */
import { Router, type IRouter } from "express";
import { and, eq, inArray, desc, or } from "drizzle-orm";
import {
  db,
  diseaseReportsTable,
  aiConversationsTable,
  farmersTable,
  type ChatMessage,
} from "@workspace/db";
import {
  DetectDiseaseBody,
  SendChatMessageBody,
  GetAiConversationParams,
} from "@workspace/api-zod";
import { getAssignedFarmerIds, canAccessFarmer } from "../lib/rbac";
import { getOpenAI, AI_MODEL, isAIConfigured, describeAIError } from "../lib/openai";

const AI_NOT_CONFIGURED_MESSAGE =
  "AI is not configured. Add an OPENAI_API_KEY to enable disease detection and the advisory chat.";

const router: IRouter = Router();

const DISEASE_SYSTEM_PROMPT = `You are an expert agronomist and plant pathologist advising smallholder farmers in Nigeria.
You will be shown a photo of a crop. Analyse it for diseases, pests, nutrient deficiencies, or other problems.
Respond ONLY with a JSON object of this exact shape:
{
  "diagnosis": string,        // disease/pest/condition name, or "Healthy" if no issue
  "confidence": number,       // integer 0-100, your confidence in the diagnosis
  "severity": "low"|"medium"|"high",  // use "low" if healthy
  "treatment": string,        // concrete, affordable treatment & prevention steps suited to Nigerian smallholders
  "summary": string           // 1-2 sentence plain-language summary of what you see
}
If the image is not a plant/crop, set diagnosis to "Not a crop image", confidence 0, severity "low".`;

const CHAT_SYSTEM_PROMPT = `You are AgroGuard's AI farming advisor for smallholder farmers in Nigeria.
Give practical, affordable, locally-relevant advice on crops, soil, irrigation, pests, diseases, fertiliser, weather and farm management.
Prefer Nigerian crops, conditions and units. Keep answers clear and concise. Do not use emojis.
If asked something unrelated to farming or agriculture, politely steer back to farming topics.`;

type Severity = "low" | "medium" | "high";

/** Input guards (defence-in-depth on top of the global body limit + Zod schemas). */
const MAX_MESSAGE_CHARS = 4000;
const MAX_CROP_TYPE_CHARS = 80;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // decoded image size cap (~10MB)
const DATA_URL_PREFIX = /^data:image\/(jpeg|jpg|png|webp);base64,/i;

/** Rough decoded-byte size of a base64 payload without allocating a Buffer. */
function approxBase64Bytes(b64: string): number {
  const len = b64.length;
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((len * 3) / 4) - padding;
}

function clampConfidence(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normaliseSeverity(value: unknown): Severity {
  return value === "high" || value === "medium" ? value : "low";
}

async function checkAILimit(userId: number, userType: string): Promise<string | null> {
  if (userType !== "farmer") return null;
  const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.id, userId));
  if (!farmer) return "User not found";
  
  if (farmer.isPremium) return null;
  
  const today = new Date();
  const usageDate = farmer.aiUsageDate ? new Date(farmer.aiUsageDate) : null;
  
  let currentCount = farmer.aiUsageCount;
  if (!usageDate || usageDate.toDateString() !== today.toDateString()) {
    currentCount = 0;
  }
  
  if (currentCount >= 50) {
    return "AI services are temporarily unavailable. Please upgrade to AgroGuard Premium or try again later.";
  }
  return null;
}

async function incrementAILimit(userId: number, userType: string) {
  if (userType !== "farmer") return;
  const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.id, userId));
  if (!farmer || farmer.isPremium) return;
  
  const today = new Date();
  const usageDate = farmer.aiUsageDate ? new Date(farmer.aiUsageDate) : null;
  
  let newCount = farmer.aiUsageCount;
  if (!usageDate || usageDate.toDateString() !== today.toDateString()) {
    newCount = 0;
  }
  
  await db.update(farmersTable)
    .set({ aiUsageCount: newCount + 1, aiUsageDate: today })
    .where(eq(farmersTable.id, userId));
}

/** POST /ai/disease-detection — analyse a crop photo with the vision model. */
router.post("/ai/disease-detection", async (req, res): Promise<void> => {
  if (!isAIConfigured()) {
    req.log.warn("AI is not configured. Falling back to mock response for pitch.");
  }

  const parsed = DetectDiseaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { imageBase64, cropType, farmerId } = parsed.data;

  if (cropType != null && cropType.length > MAX_CROP_TYPE_CHARS) {
    res.status(400).json({ error: "Crop type is too long." });
    return;
  }

  // Validate the image payload: if a data URL is supplied it must be a supported
  // image type; otherwise treat the value as raw base64.
  if (imageBase64.startsWith("data:") && !DATA_URL_PREFIX.test(imageBase64)) {
    res.status(400).json({ error: "Unsupported image format. Use JPEG, PNG or WebP." });
    return;
  }
  const rawBase64 = imageBase64.replace(DATA_URL_PREFIX, "");
  if (approxBase64Bytes(rawBase64) > MAX_IMAGE_BYTES) {
    res.status(400).json({ error: "Image is too large. Please use an image under 10MB." });
    return;
  }

  if (farmerId != null && !(await canAccessFarmer(req, farmerId))) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const imageUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const limitError = await checkAILimit(req.session.userId!, req.session.userType!);
  if (limitError) {
    res.status(403).json({ error: limitError });
    return;
  }

  let result: {
    diagnosis: string;
    confidence: number;
    severity: Severity;
    treatment: string;
    summary: string;
  };

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DISEASE_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: cropType
                ? `This is a photo of ${cropType}. Diagnose it.`
                : "Diagnose this crop photo.",
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const json = JSON.parse(raw) as Record<string, unknown>;
    result = {
      diagnosis: String(json["diagnosis"] ?? "Unknown"),
      confidence: clampConfidence(json["confidence"]),
      severity: normaliseSeverity(json["severity"]),
      treatment: String(json["treatment"] ?? "No specific treatment suggested."),
      summary: String(json["summary"] ?? ""),
    };
  } catch (err: any) {
    req.log.error({ err }, "disease detection failed");
    if (err && err.status === 429) {
      res.status(503).json({ error: "AI services are temporarily unavailable. Please upgrade to AgroGuard Premium or try again later." });
      return;
    }
    // FALLBACK FOR PITCH (if API key is invalid or rejected)
    req.log.warn("OpenAI API failed. Falling back to mock response for pitch.");
    result = {
      diagnosis: "Demo: Nutrient Deficiency",
      confidence: 88,
      severity: "medium",
      treatment: "This is a simulated demo response. Apply nitrogen-rich fertilizer and ensure consistent watering.",
      summary: "Simulated AI analysis: The crop shows typical signs of nitrogen deficiency. (Note: Real AI response unavailable)"
    };
  }

  await incrementAILimit(req.session.userId!, req.session.userType!);

  const [report] = await db
    .insert(diseaseReportsTable)
    .values({
      farmerId: farmerId ?? null,
      cropType: cropType ?? null,
      diagnosis: result.diagnosis,
      confidence: result.confidence,
      severity: result.severity,
      treatment: result.treatment,
      summary: result.summary,
      createdBy: req.session.userId!,
      createdByType: req.session.userType!,
    })
    .returning();

  res.status(201).json(report);
});

/** GET /ai/disease-reports — list reports the caller is allowed to see. */
router.get("/ai/disease-reports", async (req, res): Promise<void> => {
  const assignedIds = await getAssignedFarmerIds(req);

  // null → full access; otherwise the caller sees reports for their assigned
  // farmers plus any report they personally created.
  const where =
    assignedIds === null
      ? undefined
      : or(
          inArray(diseaseReportsTable.farmerId, assignedIds.length ? assignedIds : [-1]),
          and(
            eq(diseaseReportsTable.createdBy, req.session.userId!),
            eq(diseaseReportsTable.createdByType, req.session.userType!),
          ),
        );

  const reports = await db
    .select()
    .from(diseaseReportsTable)
    .where(where)
    .orderBy(desc(diseaseReportsTable.createdAt));

  res.json(reports);
});

/** GET /ai/conversations — list the current user's advisory conversations. */
router.get("/ai/conversations", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: aiConversationsTable.id,
      title: aiConversationsTable.title,
      updatedAt: aiConversationsTable.updatedAt,
    })
    .from(aiConversationsTable)
    .where(
      and(
        eq(aiConversationsTable.ownerId, req.session.userId!),
        eq(aiConversationsTable.ownerType, req.session.userType!),
      ),
    )
    .orderBy(desc(aiConversationsTable.updatedAt));

  res.json(rows);
});

/** GET /ai/conversations/:id — one conversation with full message history. */
router.get("/ai/conversations/:id", async (req, res): Promise<void> => {
  const params = GetAiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(aiConversationsTable)
    .where(eq(aiConversationsTable.id, params.data.id));

  if (
    !conv ||
    conv.ownerId !== req.session.userId ||
    conv.ownerType !== req.session.userType
  ) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.json({
    id: conv.id,
    title: conv.title,
    messages: conv.messages,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  });
});

/** POST /ai/chat — send a message to the advisor, creating/continuing a conversation. */
router.post("/ai/chat", async (req, res): Promise<void> => {
  if (!isAIConfigured()) {
    req.log.warn("AI is not configured. Falling back to mock response for pitch.");
  }

  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, conversationId } = parsed.data;

  if (message.trim().length === 0) {
    res.status(400).json({ error: "Message cannot be empty." });
    return;
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    res.status(400).json({ error: "Message is too long." });
    return;
  }

  const limitError = await checkAILimit(req.session.userId!, req.session.userType!);
  if (limitError) {
    res.status(403).json({ error: limitError });
    return;
  }

  // Load (and authorise) an existing conversation, or start a fresh one.
  let history: ChatMessage[] = [];
  let convId: number | null = conversationId ?? null;
  let title = message.slice(0, 60);

  if (convId != null) {
    const [conv] = await db
      .select()
      .from(aiConversationsTable)
      .where(eq(aiConversationsTable.id, convId));
    if (
      !conv ||
      conv.ownerId !== req.session.userId ||
      conv.ownerType !== req.session.userType
    ) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    history = conv.messages;
    title = conv.title;
  }

  const userMessage: ChatMessage = { role: "user", content: message };
  const conversationForModel = [...history, userMessage];

  let reply: string;
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        ...conversationForModel.map((m) => ({ role: m.role, content: m.content })),
      ],
    });
    reply = completion.choices[0]?.message?.content ?? "";
  } catch (err: any) {
    req.log.error({ err }, "advisory chat failed");
    if (err && err.status === 429) {
      res.status(503).json({ error: "AI services are temporarily unavailable. Please upgrade to AgroGuard Premium or try again later." });
      return;
    }
    // FALLBACK FOR PITCH
    req.log.warn("OpenAI API failed. Falling back to mock response for pitch.");
    reply = "This is a simulated AI response for your pitch. The OpenAI API key configured is currently invalid or missing. In a live environment, this would provide personalized farming advice based on your input.";
  }
  
  await incrementAILimit(req.session.userId!, req.session.userType!);

  const assistantMessage: ChatMessage = { role: "assistant", content: reply };
  const updatedMessages = [...conversationForModel, assistantMessage];

  if (convId == null) {
    const [created] = await db
      .insert(aiConversationsTable)
      .values({
        ownerId: req.session.userId!,
        ownerType: req.session.userType!,
        title,
        messages: updatedMessages,
      })
      .returning({ id: aiConversationsTable.id });
    convId = created!.id;
  } else {
    await db
      .update(aiConversationsTable)
      .set({ messages: updatedMessages, updatedAt: new Date() })
      .where(eq(aiConversationsTable.id, convId));
  }

  res.json({ conversationId: convId, reply, messages: updatedMessages });
});

export default router;
