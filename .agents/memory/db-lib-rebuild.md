---
name: DB lib rebuild required after schema changes
description: After adding new schema files to lib/db/src/schema/, the lib must be rebuilt before dependents can typecheck
---

## Rule
After adding new table files to `lib/db/src/schema/` and exporting them from `lib/db/src/schema/index.ts`, run:

```bash
pnpm run typecheck:libs
```

before running `pnpm --filter @workspace/api-server run typecheck`.

**Why:** The api-server imports from `@workspace/db` which is a composite lib. TypeScript uses the emitted `.d.ts` declarations, not the source files. Until `tsc --build` runs for the lib, the new exports don't exist in the emitted types, so the api-server sees "Module '@workspace/db' has no exported member 'farmersTable'".

**How to apply:** Anytime you add or remove exports from any `lib/*` package, rebuild libs first.
