import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.OB1_DEMO_AUTH_BYPASS === "true") {
    return NextResponse.next();
  }

  // Allow login page, API routes, and static assets
  if (
    pathname === "/login" ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Validate the session, not just cookie existence: unseal the iron-session
  // cookie and require loggedIn. A garbage or forged cookie fails the unseal
  // and gets an empty session, so it redirects to /login.
  const response = NextResponse.next();
  try {
    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions
    );
    if (!session.loggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
