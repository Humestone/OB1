import { createHash, timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import { HumeStoneMark } from "@/components/HumeStoneMark";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

// Constant-time equality: hash both sides to fixed-length digests so neither
// the comparison nor the length leaks timing information about the password.
function safeEqual(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

async function loginAction(formData: FormData) {
  "use server";

  const password = formData.get("password") as string;
  if (!password?.trim()) {
    return { error: "Password is required" };
  }

  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    return { error: "Login is not configured. Contact the administrator." };
  }

  if (!safeEqual(password, expected)) {
    return { error: "Incorrect password" };
  }

  // Password is the only credential the user supplies. The brain key is held
  // server-side and never stored in the session.
  const session = await getSession();
  session.loggedIn = true;
  await session.save();

  redirect("/");
}

export default async function LoginPage() {
  const session = await getSession();
  if (session.loggedIn) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent ml-0 px-4">
      <div className="ob1-login-panel w-full max-w-sm p-6">
        <div className="text-center mb-8">
          <HumeStoneMark className="mx-auto mb-4 h-16 w-16 text-lg" />
          <p className="ob1-brand-kicker mb-2">HumeStone</p>
          <h1 className="text-2xl font-semibold text-text-primary">
            Company Memory
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Enter your password to continue
          </p>
        </div>

        <LoginForm action={loginAction} />
      </div>
    </div>
  );
}
