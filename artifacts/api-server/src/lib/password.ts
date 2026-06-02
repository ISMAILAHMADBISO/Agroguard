/**
 * Password helpers shared across onboarding flows (staff + farmers).
 */
import bcrypt from "bcryptjs";

/** Generates a readable one-time temporary password (e.g. "Agro-aB3xK9..."). */
export function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `Agro-${out}`;
}

/** Hashes a plaintext password with bcrypt. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
