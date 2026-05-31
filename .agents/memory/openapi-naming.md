---
name: OpenAPI body naming and collision rules
description: Rules for naming OpenAPI schemas to avoid TS2308 export collisions in api-zod barrel
---

## Rule
Body schemas in components/schemas MUST be entity-shaped (`FarmerInput`, `FarmerUpdate`) — never operation-shaped (`CreateFarmerBody`, `UpdateFarmerBody`).

Additionally, GET endpoints with **query parameters** also cause collisions: Orval generates both a TypeScript interface in `types/` AND a Zod schema in `api.ts` with the name `<OperationIdPascal>Params`. Both are re-exported from the api-zod barrel → TS2308.

## Fix for query param collision
Remove query params from the OpenAPI spec (let the server use internal defaults), or rename the operationId to avoid the collision. The cleanest fix is to not include query params (like `limit`) in the spec at all.

**Why:** The `lib/api-zod` barrel does `export * from "./generated/api"` AND `export * from "./generated/types"`. Any name that appears in both files causes TS2308 at `pnpm run typecheck:libs`.

**How to apply:** Before running codegen, review all GET endpoints with query params. For standard pagination/filter params that would be named `<OperationId>Params`, either remove them from the spec or prefix the operationId differently.
