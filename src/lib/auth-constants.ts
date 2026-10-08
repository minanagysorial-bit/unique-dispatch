import { UserRole } from "./portal-types";

export const PORTAL_SESSION_COOKIE = "unique_dispatch_portal_session";
export const PORTAL_API_KEY_HEADER = "x-unique-dispatch-key";
export const DEFAULT_API_KEY = "ud_live_sync_8892f038c1a9";

export const AUTH_SECRET =
  process.env.PORTAL_JWT_SECRET ||
  "ud_sec_59f8c12a8849b29e018d47fe902a7c41_enterprise_grade";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  assignedShift?: "morning" | "night";
  exp: number;
}
