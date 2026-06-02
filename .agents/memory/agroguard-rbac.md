---
name: AgroGuard RBAC model
description: How the 5-role auth/RBAC and farmer onboarding decisions work and why
---

# AgroGuard RBAC decisions

Roles live on two tables. `staff` rows have role ∈ {super_admin, admin, agronomist, staff} and session `userType="staff"`. `farmers` rows are also login users with session `userType="farmer"`, role `"farmer"`. Login checks staff first, then farmers.

## Access tiers (rbac.ts helpers)
- `canSeeAll` / `canWrite` = super_admin | admin | agronomist (agronomist sees & writes ALL data by design — no per-record scope needed for them).
- `isAdmin` = super_admin | admin. `isSuperAdmin` = super_admin only.
- Scoped `staff` role: read-only, sees only farmers where `fieldOfficerId = their userId`.
- `farmer`: sees only their own farmer id (`getAssignedFarmerIds` returns `[ownId]`).

## Durable decisions (why)
- **Scoped `staff` is read-only on alerts/recommendations.** Writes require `canWrite` (agronomist+). **Why:** a prior security review flagged wide-open mutation routes; gating to canWrite is the simplest correct fix. Field staff collect/observe; senior roles act.
- **Farmer logins are blocked from platform-wide surfaces at the API, not just the UI.** `/dashboard/*` (router-level `requireStaffType`), `GET /readings`, `GET /staff` all require `userType==="staff"`. **Why:** UI nav hiding is not enforcement; farmers could call the API directly. Internal staff (all staff roles) keep these; only farmers are blocked. Farmers use scoped endpoints only.
- **Mutations check `canAccessFarmer(req, farmerId)`.** POST validates `body.farmerId`; PATCH fetches the record's `farmerId` first, then checks. **Why:** prevents IDOR/cross-tenant tampering.
- **Scoped device access must reject `farmerId === null`.** In `GET /devices/:id` and `/:id/readings`, the deny condition denies scoped users when device.farmerId is null OR not in their assigned set. **Why:** an earlier bug only denied non-null mismatches, leaking unassigned devices to scoped users.

## Onboarding (shared temp-password pattern)
- Both `POST /staff` and `POST /farmers` generate a one-time temp password via `lib/password.ts` (`generateTempPassword`, `hashPassword`), store the hash with `mustChangePassword=true`, and return `tempPassword` ONCE in the create response (StaffCreateResult / FarmerCreateResult schemas). Frontend shows a credentials dialog. **Why:** farmers created without a password could not log in; this mirrors staff onboarding so every created account gets working credentials.
