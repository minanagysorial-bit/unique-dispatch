import { User, UserRole } from "./portal-types";

export const PORTAL_SESSION_COOKIE = "unique_dispatch_portal_session";
export const PORTAL_API_KEY_HEADER = "x-unique-dispatch-key";
export const DEFAULT_API_KEY = "ud_live_sync_8892f038c1a9";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  assignedShift?: "morning" | "night";
  exp: number;
}

export function createSessionToken(user: User): string {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    assignedShift: user.assignedShift,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const json = JSON.stringify(payload);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json).toString("base64url");
  }
  return btoa(json);
}

export function parseSessionToken(token: string): SessionPayload | null {
  try {
    let json = "";
    if (typeof Buffer !== "undefined") {
      json = Buffer.from(token, "base64url").toString("utf8");
    } else {
      json = atob(token);
    }
    const payload = JSON.parse(json) as SessionPayload;
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}
