---
name: AgroGuard AI features
description: Disease-detection + advisory-chat design decisions and the cross-role routing pattern
---

# AgroGuard AI features (disease detection + advisory chat)

## Cross-role page access
Both staff and farmers must reach the AI pages, but the ProtectedRoute guard's
`access` prop only had "staff"/"farmer"/"admin" (each excludes the others).
Added `access="any"` — it requires auth + password-change but applies no role
gate. Use it for any page both user types share.
**How to apply:** add nav links in BOTH the farmer "My Farm" group and the staff
"Platform" group in `layout.tsx`; gate the route with `access="any"`.

## Server-side AI input guards (defence-in-depth)
Zod schemas alone don't cap sizes/format. Route-level guards live in
`routes/ai.ts`: image data-URL prefix must match jpeg/png/webp, decoded base64
size capped (~10MB) via byte-estimate (no Buffer alloc), message length capped +
non-empty (trim) check. The global express.json limit is 15mb for base64 images.
**Why:** architect review flagged missing per-route input validation.

## OpenAI model + failure mode
Uses `gpt-4o` (vision-capable, reliable with user-supplied keys). A 502 from
/ai/chat or /ai/disease-detection with `insufficient_quota` (429 upstream) is a
billing problem on the OpenAI account, NOT a code bug — code path is verified.
