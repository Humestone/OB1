import "server-only";
import { fetchThoughts, searchThoughts } from "./api";
import type { Tone } from "@/components/mission-control/sample-data";

/*
 * Mission Control — live data layer (Phase B).
 * Reads recent STATUS RECORDs from Company Memory (read-only, server-side key)
 * and derives the cockpit model. No writes. Falls back to sample data in the
 * page if this throws.
 */

export interface CockpitLive {
  live: true;
  hero: { name: string; greeting: string; status: { label: string; tone: Tone }; workingOn: string; updated: string };
  kpis: { eyebrow: string; value: string; caption: string; accent: string; tone: Tone }[];
  approvals: { title: string; why: string; plain: string; tone: Tone }[];
  runs: { title: string; state: "building" | "done" | "healthy"; plain: string }[];
  gates: { label: string; state: string; plain: string; tone: Tone }[];
  health: { label: string; pct: number; caption: string; accent: string }[];
}

interface ParsedRecord {
  project: string;
  done: string;
  next: string;
  blockedBy: string;
  createdAt: string;
}

function field(content: string, label: string): string {
  const m = content.match(new RegExp(`^\\s*${label}:\\s*(.+)$`, "mi"));
  return m ? m[1].trim() : "";
}

function clip(s: string, n: number): string {
  s = s.replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

function shortProject(p: string): string {
  // Trim the trailing "/ subtitle" noise and over-long phase names.
  return clip(p.split(/ -- | – | — /)[0].split(" / ")[0], 52);
}

export async function getCockpitLive(apiKey: string): Promise<CockpitLive | null> {
  const res = await fetchThoughts(apiKey, {
    per_page: 40,
    sort: "created_at",
    order: "desc",
  });
  const rows = (res?.data ?? []) as Array<{ content?: string; created_at?: string; metadata?: { category?: string } }>;

  const records: ParsedRecord[] = rows
    .filter((r) => (r.content || "").trim().startsWith("STATUS RECORD"))
    .map((r) => ({
      project: field(r.content || "", "PROJECT"),
      done: field(r.content || "", "DONE"),
      next: field(r.content || "", "NEXT"),
      blockedBy: field(r.content || "", "BLOCKED BY"),
      createdAt: r.created_at || "",
    }))
    .filter((r) => r.project);

  if (records.length === 0) return null;

  const newest = records[0];
  const now = Date.now();
  const within = (r: ParsedRecord, ms: number) => now - new Date(r.createdAt).getTime() <= ms;

  // Approvals: records whose blocker clearly waits on James / approval.
  const needsJames = (r: ParsedRecord) =>
    /james|approval|approve|your ok|go-ahead|sign-?off|confirm/i.test(r.blockedBy) &&
    !/^nothing|^none/i.test(r.blockedBy.trim());

  const seenA = new Set<string>();
  const approvals = records
    .filter(needsJames)
    .filter((r) => {
      const k = shortProject(r.project);
      if (seenA.has(k)) return false;
      seenA.add(k);
      return true;
    })
    .slice(0, 3)
    .map((r) => ({
      title: shortProject(r.project),
      why: "Waiting on your approval",
      plain: clip(r.next || r.blockedBy, 150),
      tone: "attention" as Tone,
    }));

  // Runs: most recent distinct projects.
  const seenR = new Set<string>();
  const runs = records
    .filter((r) => {
      const k = shortProject(r.project);
      if (seenR.has(k)) return false;
      seenR.add(k);
      return true;
    })
    .slice(0, 4)
    .map((r) => {
      const done = `${r.done} ${r.next}`;
      const state: "building" | "done" | "healthy" = /shipp|deploy|live|complete|accepted|merged|verified|locked/i.test(r.done)
        ? "done"
        : /^nothing|^none/i.test(r.blockedBy.trim())
          ? "healthy"
          : "building";
      return { title: shortProject(r.project), state, plain: clip(r.done || done, 130) };
    });

  const activeProjects = new Set(
    records.filter((r) => within(r, 36 * 3600 * 1000)).map((r) => shortProject(r.project))
  ).size;

  const kpis = [
    {
      eyebrow: "Needs your approval",
      value: String(approvals.length),
      caption: "Items where Stone is waiting on your yes / no.",
      accent: "#ffb454",
      tone: "attention" as Tone,
    },
    {
      eyebrow: "Active projects",
      value: String(activeProjects || runs.length),
      caption: "Distinct projects with activity in the last day or so.",
      accent: "#3ddc97",
      tone: "good" as Tone,
    },
    {
      eyebrow: "Last verified",
      value: relTime(newest.createdAt),
      caption: "When Company Memory last recorded a verified status.",
      accent: "#a78bfa",
      tone: "info" as Tone,
    },
  ];

  // ---- System health (live) ----
  const total = res?.total ?? records.length;
  const week = 7 * 24 * 3600 * 1000;
  const recentCount = rows.filter((r) => r.created_at && now - new Date(r.created_at).getTime() <= week).length;

  // Cheap probe of whether meaning-based (semantic) search is up.
  let aiOk = true;
  try {
    await searchThoughts(apiKey, "status", "semantic", 1);
  } catch {
    aiOk = false;
  }

  const health = [
    { label: "Company Memory", pct: 100, caption: `${total.toLocaleString()} records · in sync`, accent: "#3ddc97" },
    {
      label: "Smart search",
      pct: aiOk ? 100 : 55,
      caption: aiOk ? "Meaning-based search on" : "Keyword only — AI credits low",
      accent: aiOk ? "#7c8cff" : "#ffb454",
    },
    {
      label: "Recent activity",
      pct: 100,
      caption: `${recentCount} update${recentCount === 1 ? "" : "s"} this week`,
      accent: "#a78bfa",
    },
  ];

  // ---- Gate ledger: standing safety policy + live Hermes hold ----
  const hermesHeld = records.some(
    (r) =>
      /hermes/i.test(`${r.project} ${r.blockedBy} ${r.next}`) &&
      /hold|held|pending|approval/i.test(`${r.blockedBy} ${r.next}`)
  );
  const gates = [
    {
      label: "Production deploys",
      state: "Gated",
      plain: "Stone always asks you before anything goes live.",
      tone: "attention" as Tone,
    },
    {
      label: "Secrets & credentials",
      state: "Gated",
      plain: "No key or access changes without your explicit OK.",
      tone: "attention" as Tone,
    },
    {
      label: "Hermes provider retry",
      state: hermesHeld ? "Held" : "Ready",
      plain: hermesHeld ? "Paused until you approve a provider/key retry." : "No active hold.",
      tone: (hermesHeld ? "blocked" : "good") as Tone,
    },
  ];

  return {
    live: true,
    hero: {
      name: "James",
      greeting: "Here's where Stone stands.",
      status: approvals.length > 0 ? { label: "Needs you", tone: "attention" } : { label: "On track", tone: "good" },
      workingOn: shortProject(newest.project),
      updated: `${relTime(newest.createdAt)} ago`,
    },
    kpis,
    approvals,
    runs,
    gates,
    health,
  };
}
