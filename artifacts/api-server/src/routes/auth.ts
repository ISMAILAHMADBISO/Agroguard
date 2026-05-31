/**
 * Auth routes — session-based login for staff members.
 * POST /auth/login   → validates email + password, sets session
 * POST /auth/logout  → destroys session
 * GET  /auth/me      → returns current session user
 */
import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, staffTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [staff] = await db
    .select()
    .from(staffTable)
    .where(eq(staffTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!staff || !staff.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (staff.status !== "active") {
    res.status(403).json({ error: "Account is inactive. Contact an administrator." });
    return;
  }

  const valid = await bcrypt.compare(password, staff.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = staff.id;
  req.session.userRole = staff.role;
  req.session.userName = staff.name;
  req.session.userEmail = staff.email;

  res.json({
    id: staff.id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    department: staff.department,
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("agroguard.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    id: req.session.userId,
    name: req.session.userName,
    email: req.session.userEmail,
    role: req.session.userRole,
  });
});

export default router;
