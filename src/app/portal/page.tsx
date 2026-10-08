import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { parseSessionToken, PORTAL_SESSION_COOKIE } from "@/lib/auth-utils";

export default async function PortalRootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/portal/login");
  }

  const payload = parseSessionToken(token);

  if (!payload) {
    redirect("/portal/login");
  }

  if (payload.role === "super_admin") {
    redirect("/portal/admin");
  } else {
    redirect("/portal/dispatcher");
  }
}
