---
name: AgroGuard RBAC model
description: How the 5-role auth/RBAC and farmer onboarding decisions work and why
---

# AgroGuard RBAC decisions

Roles live on two tables. `staff` rows have role ∈ {super_admin, admin, agronomist, staff} and session `userType="staff"`. `farmers` rows are also login users with session `userType="farmer"`, role `"farmer"`. Login checks staff first, then farmers.

## Access tiers (rbac.ts helpers)
- `canSeeAll` / `canWrite` = ALL internal staff types (super_admin | admin | agronomist | staff). Every `userType==="staff"` row writes & sees all farmers/devices by design — no per-record scope.
- `isAdmin` = super_admin | admin. `isSuperAdmin` = super_admin only.
- `farmer`: sees only their own farmer id (`getAssignedFarmerIds` returns `[ownId]`).

## Durable decisions (why)
- **`staff` role can create/write farmers, devices and staff (NOT read-only).** This SUPERSEDES the earlier "scoped staff is read-only" model. `canWrite`/`canSeeAll` now include `staff`. **Why:** product requirement — admin AND staff must onboard farmers/devices/team. Field staff are trusted operators, not just observers.
- **Anti-escalation cap on staff creation:** `POST /staff` allows any staff-type user, but creating role `admin`/`super_admin` requires `isAdmin(req)`. Frontend role picker (`pages/staff.tsx`) caps non-admins to `agronomist|staff`. PATCH/DELETE `/staff` stay admin-only. **Why:** prevent privilege escalation while still letting staff grow the team.
- **Farmer self-signup is a custom auth route, not OpenAPI.** `POST /auth/signup` (like login/logout/me) is hand-written and uses manual `fetch` on the frontend — auth has NEVER been in `openapi.yaml`, so signup follows that established pattern (not contract drift). Creates `role=userType=farmer`, dedupes email across staff+farmer, logs in via session.
- **Farmer logins are blocked from platform-wide surfaces at the API, not just the UI.** `/dashboard/*` (router-level `requireStaffType`), `GET /readings`, `GET /staff` all require `userType==="staff"`. **Why:** UI nav hiding is not enforcement; farmers could call the API directly. Internal staff (all staff roles) keep these; only farmers are blocked. Farmers use scoped endpoints only.
- **Mutations check `canAccessFarmer(req, farmerId)`.** POST validates `body.farmerId`; PATCH fetches the record's `farmerId` first, then checks. **Why:** prevents IDOR/cross-tenant tampering.
- **Scoped device access must reject `farmerId === null`.** In `GET /devices/:id` and `/:id/readings`, the deny condition denies scoped users when device.farmerId is null OR not in their assigned set. **Why:** an earlier bug only denied non-null mismatches, leaking unassigned devices to scoped users.

## Onboarding (shared temp-password pattern)
- Both `POST /staff` and `POST /farmers` generate a one-time temp password via `lib/password.ts` (`generateTempPassword`, `hashPassword`), store the hash with `mustChangePassword=true`, and return `tempPassword` ONCE in the create response (StaffCreateResult / FarmerCreateResult schemas). Frontend shows a credentials dialog. **Why:** farmers created without a password could not log in; this mirrors staff onboarding so every created account gets working credentials.

## Password reset (reset-not-reveal)
- Passwords are bcrypt-hashed and CANNOT be revealed. "Reset password" = generate a NEW temp password, store hash with `mustChangePassword=true`, return it ONCE (shared `PasswordResetResult` schema). `POST /farmers/{id}/reset-password` (gated `canWrite`) and `POST /staff/{id}/reset-password` (gated `isAdmin`). **Why:** the only secure way to "recover" access to a hashed account is to set a new credential.
- **Permission split:** admin resets/edits/deletes BOTH staff and farmers; staff-type users manage FARMERS only. `DELETE /farmers/{id}` was broadened from `isAdmin` to `canWrite` so any internal staff can delete farmers. Staff mutations (`PATCH/DELETE/reset-password /staff`) stay `isAdmin`. **Why:** product requirement — staff manage the farmer roster but cannot touch internal team accounts.
