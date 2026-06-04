---
name: Demo-account consistency across surfaces
description: The three places demo credentials live must always agree
---

# Demo accounts must match across three surfaces

AgroGuard advertises clickable demo logins. The exact emails appear in THREE places
that must stay in lockstep:

1. The login page's autofill list (the demo-credentials buttons).
2. The seed script that inserts the accounts into the DB.
3. The local-setup docs table in replit.md.

If any one drifts, a fresh `npm run setup` plus clicking the autofill button logs in
with an email that has no matching row → login fails for a brand-new user.

**Concrete trap hit:** the farmer demo is `emeka.chukwu@farm.ng` (note the `@farm.ng`
domain, not `@agroguard.ng` like the staff accounts). Don't "normalize" it to the
agroguard.ng domain in the seed/docs — match the login page exactly.

**Why:** the whole point of the autofill demo buttons is zero-friction first login on a
fresh install; a mismatch silently breaks that on day one.

**How to apply:** whenever you add/rename a demo account, grep the login page for the
demo list, update the seed script, and update the replit.md table in the same change.
