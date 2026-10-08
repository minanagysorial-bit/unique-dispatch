import { SessionPayload } from "./auth-constants";

/**
 * Edge-compatible session token parser.
 * Decodes the base64url payload without Node.js crypto module dependencies.
 */
export function parseEdgeSessionToken(token: string): SessionPayload | null {
  try {
    if (!token || !token.includes(".")) return null;

    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) return null;

    // Edge & Browser safe base64url decode
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof atob === "function"
      ? decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        )
      : Buffer.from(payloadBase64, "base64url").toString("utf8");

    const payload = JSON.parse(json) as SessionPayload;

    if (payload.exp && payload.exp < Date.now()) {
      return null; // Expired
    }

    return payload;
  } catch (e) {
    return null;
  }
}
