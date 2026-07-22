import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions, type SessionData } from "./session";

export { sessionOptions, type SessionData };

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export function getBrainKey(): string {
  const key = process.env.OPEN_BRAIN_KEY || process.env.MCP_ACCESS_KEY;
  if (!key) {
    throw new Error(
      "Server brain key is not configured (set OPEN_BRAIN_KEY or MCP_ACCESS_KEY)"
    );
  }
  return key;
}

function demoAuthBypass() {
  if (process.env.OB1_DEMO_AUTH_BYPASS !== "true") return null;
  return {
    apiKey: process.env.OB1_DASHBOARD_DEMO_KEY || "local-screenshot-key",
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * For API route handlers: returns apiKey or throws AuthError.
 * Call BEFORE parsing request body so unauthed requests get 401, not 400.
 */
export async function requireSession(): Promise<{ apiKey: string }> {
  const demoSession = demoAuthBypass();
  if (demoSession) return demoSession;

  const session = await getSession();
  if (!session.loggedIn) {
    throw new AuthError();
  }
  return { apiKey: getBrainKey() };
}

/**
 * For server components and server actions: returns session or redirects to /login.
 */
export async function requireSessionOrRedirect(): Promise<{
  apiKey: string;
}> {
  const demoSession = demoAuthBypass();
  if (demoSession) return demoSession;

  const session = await getSession();
  if (!session.loggedIn) {
    redirect("/login");
  }
  return { apiKey: getBrainKey() };
}
