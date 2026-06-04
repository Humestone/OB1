import { redirect } from "next/navigation";
import { HumeStoneMark } from "@/components/HumeStoneMark";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

async function loginAction(formData: FormData) {
  "use server";

  const apiKey = formData.get("apiKey") as string;
  if (!apiKey?.trim()) {
    return { error: "API key is required" };
  }

  // Validate key against health endpoint
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/health`, {
      headers: { "x-brain-key": apiKey },
    });
    if (!res.ok) {
      return { error: "Invalid API key or service unavailable" };
    }
  } catch {
    return { error: "Could not reach API. Check your connection." };
  }

  const session = await getSession();
  session.apiKey = apiKey;
  session.loggedIn = true;
  await session.save();

  redirect("/");
}

export default async function LoginPage() {
  const session = await getSession();
  if (session.loggedIn && session.apiKey) {
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
            Enter your access key to continue
          </p>
        </div>

        <LoginForm action={loginAction} />
      </div>
    </div>
  );
}
