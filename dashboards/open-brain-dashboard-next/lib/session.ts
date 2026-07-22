import type { SessionOptions } from "iron-session";

/*
 * Session config shared by lib/auth.ts and proxy.ts. This file intentionally
 * avoids next/headers and next/navigation so the request proxy can bundle it.
 */

export interface SessionData {
  loggedIn?: boolean;
  restrictedUnlocked?: boolean;
}

function shouldUseSecureCookie() {
  if (process.env.AUTH_COOKIE_SECURE) {
    return process.env.AUTH_COOKIE_SECURE === "true";
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  return appUrl.startsWith("https://") || process.env.VERCEL === "1";
}

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error(
    "SESSION_SECRET env var is required and must be at least 32 characters"
  );
}

export const sessionOptions: SessionOptions = {
  cookieName: "open_brain_session",
  password: SESSION_SECRET,
  ttl: 60 * 60 * 24,
  cookieOptions: {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: "lax" as const,
    path: "/",
  },
};
