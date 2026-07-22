import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.OB1_DEMO_AUTH_BYPASS === "true") {
    return NextResponse.next();
  }

  // API routes authenticate themselves before reading request bodies.
  if (
    pathname === "/login" ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Unseal the session so a forged or garbage cookie cannot pass the gate.
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
