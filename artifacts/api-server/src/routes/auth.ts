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
import { signSessionId } from "../lib/session-token";

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

    // Persist the session before returning the token so the token always
    // references a row that already exists in the store (avoids a race where a
    // fast follow-up request arrives before the implicit end-of-response save).
    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: "Could not establish session" });
        return;
      }
      res.json({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        userType: "staff",
        department: staff.department,
        mustChangePassword: staff.mustChangePassword,
        token: signSessionId(req.sessionID),
      });
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

    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: "Could not establish session" });
        return;
      }
      res.json({
        id: farmer.id,
        name: farmer.name,
        email: farmer.email,
        role: "farmer",
        userType: "farmer",
        mustChangePassword: farmer.mustChangePassword,
        token: signSessionId(req.sessionID),
      });
    });
    return;
  }

  res.status(401).json({ error: "Invalid email or password" });
});

/**
 * POST /auth/signup — public farmer self-registration.
 * Creates an active farmer account with the password the farmer chooses, then
 * logs them straight in. Newly registered farmers appear immediately in the
 * farmers list for admins and staff to manage.
 */
router.post("/auth/signup", async (req, res): Promise<void> => {
  const {
    name,
    email,
    password,
    phone,
    location,
    farmName,
    farmSizeHectares,
    cropTypes,
    whatsappNumber,
  } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    location?: string;
    farmName?: string;
    farmSizeHectares?: number;
    cropTypes?: string;
    whatsappNumber?: string;
  };

  if (!name || !email || !password || !phone || !location) {
    res.status(400).json({
      error: "Name, email, password, phone and location are required",
    });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Email must be unique across both staff and farmer accounts.
  const [existingStaff] = await db
    .select({ id: staffTable.id })
    .from(staffTable)
    .where(eq(staffTable.email, normalizedEmail))
    .limit(1);
  const [existingFarmer] = await db
    .select({ id: farmersTable.id })
    .from(farmersTable)
    .where(eq(farmersTable.email, normalizedEmail))
    .limit(1);

  if (existingStaff || existingFarmer) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [farmer] = await db
    .insert(farmersTable)
    .values({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      location: location.trim(),
      farmName: farmName?.trim() || null,
      farmSizeHectares: farmSizeHectares ?? null,
      cropTypes: cropTypes?.trim() || null,
      whatsappNumber: whatsappNumber?.trim() || null,
      status: "active",
      passwordHash,
      mustChangePassword: false,
    })
    .returning();

  req.session.userId = farmer.id;
  req.session.userRole = "farmer";
  req.session.userType = "farmer";
  req.session.userName = farmer.name;
  req.session.userEmail = farmer.email ?? normalizedEmail;
  req.session.mustChangePassword = false;

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Could not establish session" });
      return;
    }
    res.status(201).json({
      id: farmer.id,
      name: farmer.name,
      email: farmer.email,
      role: "farmer",
      userType: "farmer",
      mustChangePassword: false,
      token: signSessionId(req.sessionID),
    });
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
