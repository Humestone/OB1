import { NextRequest, NextResponse } from "next/server";
import { requireSession, AuthError } from "@/lib/auth";
import {
  governanceReadOnlyPayload,
  isGovernanceReadOnly,
} from "@/lib/governance";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let apiKey: string;
  try {
    ({ apiKey } = await requireSession());
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw err;
  }

  if (isGovernanceReadOnly()) {
    return NextResponse.json(governanceReadOnlyPayload("ingest_execute"), {
      status: 403,
    });
  }

  const { id } = await params;
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  try {
    const res = await fetch(`${API_URL}/ingestion-jobs/${id}/execute`, {
      method: "POST",
      headers: { "x-brain-key": apiKey, "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
