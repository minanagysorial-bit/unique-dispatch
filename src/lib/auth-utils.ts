import crypto from "crypto";
import { User, UserRole } from "./portal-types";

export const PORTAL_SESSION_COOKIE = "unique_dispatch_portal_session";
export const PORTAL_API_KEY_HEADER = "x-unique-dispatch-key";
export const DEFAULT_API_KEY = "ud_live_sync_8892f038c1a9";

const AUTH_SECRET = process.env.PORTAL_JWT_SECRET || "ud_sec_59f8c12a8849b29e018d47fe902a7c41_enterprise_grade";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  assignedShift?: "morning" | "night";
  exp: number;
}

// 1. Cryptographic Password Hashing (PBKDF2 with Salt & 100,000 Iterations)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;

    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
  } catch (e) {
    return false;
  }
}

// 2. Cryptographically Signed Session Tokens (Payload + HMAC-SHA256 Signature)
export function createSessionToken(user: User): string {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    assignedShift: user.assignedShift,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payloadBase64).digest("base64url");

  return `${payloadBase64}.${signature}`;
}

export function parseSessionToken(token: string): SessionPayload | null {
  try {
    if (!token || !token.includes(".")) return null;

    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) return null;

    // Verify HMAC signature
    const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payloadBase64).digest("base64url");
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      console.warn("⚠️ Security Alert: Tampered or invalid session token detected!");
      return null;
    }

    const json = Buffer.from(payloadBase64, "base64url").toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;

    if (payload.exp && payload.exp < Date.now()) {
      return null; // Expired
    }

    return payload;
  } catch (e) {
    return null;
  }
}

// 3. In-Memory Brute-Force Rate Limiting (5 failed attempts = 15 min lock)
interface RateLimitEntry {
  attempts: number;
  lockedUntil: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

export function checkLoginRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry) {
    return { allowed: true, remainingAttempts: 5 };
  }

  if (entry.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // If lock expired, reset
  if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
    loginAttempts.delete(key);
    return { allowed: true, remainingAttempts: 5 };
  }

  const remaining = Math.max(0, 5 - entry.attempts);
  return { allowed: remaining > 0, remainingAttempts: remaining };
}

export function recordFailedLogin(identifier: string): { locked: boolean; retryAfterSeconds?: number } {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const entry = loginAttempts.get(key) || { attempts: 0, lockedUntil: 0 };

  entry.attempts += 1;

  if (entry.attempts >= 5) {
    entry.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
    loginAttempts.set(key, entry);
    return { locked: true, retryAfterSeconds: 15 * 60 };
  }

  loginAttempts.set(key, entry);
  return { locked: false };
}

export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier.toLowerCase().trim());
}
