/**
 * Auth routes — session-based login for staff members and farmers.
 * POST /auth/login            → validates email + password (staff first, then farmers), sets session
 * POST /auth/logout           → destroys session
 * GET  /auth/me               → returns current session user
 * POST /auth/change-password  → changes the logged-in user's password
 */
import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, staffTable, farmersTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Try staff accounts first.
  const [staff] = await db
    .select()
    .from(staffTable)
    .where(eq(staffTable.email, normalizedEmail))
    .limit(1);

  if (staff && staff.passwordHash) {
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
    req.session.userType = "staff";
    req.session.userName = staff.name;
    req.session.userEmail = staff.email;
    req.session.mustChangePassword = staff.mustChangePassword;

    res.json({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      userType: "staff",
      department: staff.department,
      mustChangePassword: staff.mustChangePassword,
    });
    return;
  }

  // 2. Fall back to farmer accounts.
  const [farmer] = await db
    .select()
    .from(farmersTable)
    .where(eq(farmersTable.email, normalizedEmail))
    .limit(1);

  if (farmer && farmer.passwordHash) {
    if (farmer.status === "inactive") {
      res.status(403).json({ error: "Account is inactive. Contact an administrator." });
      return;
    }
    const valid = await bcrypt.compare(password, farmer.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    req.session.userId = farmer.id;
    req.session.userRole = "farmer";
    req.session.userType = "farmer";
    req.session.userName = farmer.name;
    req.session.userEmail = farmer.email ?? normalizedEmail;
    req.session.mustChangePassword = farmer.mustChangePassword;

    res.json({
      id: farmer.id,
      name: farmer.name,
      email: farmer.email,
      role: "farmer",
      userType: "farmer",
      mustChangePassword: farmer.mustChangePassword,
    });
    return;
  }

  res.status(401).json({ error: "Invalid email or password" });
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
    userType: req.session.userType,
    mustChangePassword: req.session.mustChangePassword ?? false,
  });
});

router.post("/auth/change-password", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password are required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }

  const userId = req.session.userId;
  const hash = await bcrypt.hash(newPassword, 10);

  if (req.session.userType === "farmer") {
    const [farmer] = await db
      .select()
      .from(farmersTable)
      .where(eq(farmersTable.id, userId))
      .limit(1);
    if (!farmer || !farmer.passwordHash) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    if (!(await bcrypt.compare(currentPassword, farmer.passwordHash))) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    await db
      .update(farmersTable)
      .set({ passwordHash: hash, mustChangePassword: false })
      .where(eq(farmersTable.id, userId));
  } else {
    const [staff] = await db
      .select()
      .from(staffTable)
      .where(eq(staffTable.id, userId))
      .limit(1);
    if (!staff || !staff.passwordHash) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    if (!(await bcrypt.compare(currentPassword, staff.passwordHash))) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    await db
      .update(staffTable)
      .set({ passwordHash: hash, mustChangePassword: false })
      .where(eq(staffTable.id, userId));
  }

  req.session.mustChangePassword = false;
  res.json({ ok: true });
});

export default router;
