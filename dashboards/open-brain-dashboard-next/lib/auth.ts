import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface SessionData {
  loggedIn?: boolean;
  restrictedUnlocked?: boolean;
}

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * The brain (Company Memory) access key lives server-side only — it is never
 * typed at login or stored in the session. All dashboard reads use this.
 * Prefers OPEN_BRAIN_KEY (clearer name); falls back to the legacy MCP_ACCESS_KEY.
 * Throws (not AuthError) when unconfigured so it surfaces as a server
 * misconfiguration (500), not an auth failure (401).
 */
export function getBrainKey(): string {
  const key = process.env.OPEN_BRAIN_KEY || process.env.MCP_ACCESS_KEY;
  if (!key) {
    throw new Error(
      "Server brain key is not configured (set OPEN_BRAIN_KEY or MCP_ACCESS_KEY)"
    );
  }
  return key;
}

function shouldUseSecureCookie() {
  if (process.env.AUTH_COOKIE_SECURE) {
    return process.env.AUTH_COOKIE_SECURE === "true";
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  return appUrl.startsWith("https://") || process.env.VERCEL === "1";
}

// Fail fast if SESSION_SECRET is missing or too short
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error(
    "SESSION_SECRET env var is required and must be at least 32 characters"
  );
}

export const sessionOptions: SessionOptions = {
  cookieName: "open_brain_session",
  password: SESSION_SECRET,
  ttl: 60 * 60 * 24, // 24 hours
  cookieOptions: {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: "lax" as const,
    path: "/",
  },
};

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
