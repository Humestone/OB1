import { NextRequest, NextResponse } from "next/server";
import { searchThoughts } from "@/lib/api";
import { AuthError, requireSession } from "@/lib/auth";

/*
 * Ask Open Brain — Phase C.
 * Read-only natural-language search over Company Memory via semantic search.
 * Server-side key only; no writes. (Plain-language synthesis is a later upgrade
 * that needs an LLM key — this returns the genuinely-relevant records.)
 */

export const dynamic = "force-dynamic";

const STOP = new Set(
  ("a an the of in on at to for and or but with our us we i you me my your this that these those it its " +
    "what which who whom whose when where why how is are was were be been being do does did have has had will " +
    "would can could should over past about show tell give list any all from as so just please").split(/\s+/)
);

// Reduce a natural-language question to its content keywords for keyword search.
function keywords(q: string): string {
  const words = q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  return words.join(" ") || q;
}

function summarize(content: string): { title: string; snippet: string } {
  const text = (content || "").replace(/\s+/g, " ").trim();
  const project = content.match(/^\s*PROJECT:\s*(.+)$/im);
  const titleLine = content.match(/^\s*(?:Title|TITLE):\s*(.+)$/im);
  let title = (project?.[1] || titleLine?.[1] || text.slice(0, 64)).trim();
  title = title.split(/ -- | – | — | \/ /)[0].slice(0, 64).trim();
  const done = content.match(/^\s*DONE:\s*(.+)$/im);
  const snippet = (done?.[1] || text).replace(/\s+/g, " ").trim().slice(0, 190);
  return { title, snippet };
}

// Synthesize a plain-English answer from the retrieved records via OpenRouter.
// Returns null when no key is set or the call fails (caller falls back to the list).
async function synthesize(
  question: string,
  results: { title: string; snippet: string; date?: string }[]
): Promise<string | null> {
  if (process.env.MISSION_CONTROL_AI_ANSWERS_ENABLED !== "true") return null;
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || results.length === 0) return null;
  const context = results
    .map((r, i) => `[${i + 1}] ${r.title} (${(r.date || "").slice(0, 10)}): ${r.snippet}`)
    .join("\n");
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-haiku",
        max_tokens: 320,
        messages: [
          {
            role: "system",
            content:
              "You are Stone, James's AI chief of staff for HumeStone. Answer the question in 2-4 plain-English sentences using ONLY the provided Company Memory records. Be specific and concise; no jargon. If the records don't answer it, say so briefly. Never invent facts.",
          },
          { role: "user", content: `Question: ${question}\n\nCompany Memory records:\n${context}` },
        ],
      }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let apiKey: string;
  try {
    ({ apiKey } = await requireSession());
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Company Memory is not configured." },
      { status: 500 }
    );
  }

  let question = "";
  try {
    question = String((await req.json())?.question || "");
  } catch {
    /* ignore */
  }
  question = question.slice(0, 300).trim();
  if (!question) {
    return NextResponse.json({ error: "Question required." }, { status: 400 });
  }

  try {
    // Prefer semantic search; fall back to text if the embedding service is down.
    let data;
    try {
      data = await searchThoughts(apiKey, question, "semantic", 5);
    } catch {
      data = await searchThoughts(apiKey, keywords(question), "text", 5);
    }
    const results = (data.results || []).slice(0, 5).map((r) => {
      const { title, snippet } = summarize(r.content || "");
      return { id: r.id, title, snippet, date: r.created_at };
    });
    const synthesized = await synthesize(question, results);
    const answer =
      synthesized ||
      (results.length
        ? `Here ${results.length === 1 ? "is the" : "are the"} ${results.length} most relevant ${
            results.length === 1 ? "record" : "records"
          } in Company Memory for "${question}":`
        : `I couldn't find anything in Company Memory matching "${question}". Try rephrasing it.`);
    return NextResponse.json({ answer, results, synthesized: !!synthesized });
  } catch {
    return NextResponse.json({ answer: "Couldn't reach Company Memory just now.", results: [] }, { status: 502 });
  }
}
