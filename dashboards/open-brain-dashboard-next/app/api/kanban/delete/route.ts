import { NextRequest, NextResponse } from "next/server";
import { requireSession, AuthError } from "@/lib/auth";
import { deleteThought } from "@/lib/api";
import {
  governanceReadOnlyPayload,
  isGovernanceReadOnly,
} from "@/lib/governance";

export async function POST(request: NextRequest) {
  let apiKey: string;
  try {
    ({ apiKey } = await requireSession());
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw err;
  }

  if (isGovernanceReadOnly()) {
    return NextResponse.json(governanceReadOnlyPayload("kanban_delete"), {
      status: 403,
    });
  }

  try {
    const body = await request.json();
    const { thoughtId } = body;

    if (!thoughtId || typeof thoughtId !== "string") {
      return NextResponse.json(
        { error: "thoughtId (string) is required" },
        { status: 400 }
      );
    }

    await deleteThought(apiKey, thoughtId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
