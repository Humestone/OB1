import "server-only";
import { fetchThoughts, searchThoughts } from "./api";
import type { Tone } from "@/components/mission-control/sample-data";

/*
 * Mission Control — live data layer (Phase B, reworked 2026-07-03 for the
 * surface convergence fixes F3+F4).
 * Reads from Company Memory (read-only, server-side key). No writes. If this
 * throws, the page renders an explicit "live status unavailable" surface; if
 * it returns null (no STATUS RECORDs), the page renders an honest empty
 * state. Sample data is never a fallback; preview is ?preview=1 only.
 *
 * Two sources, honestly separated:
 * - QUEUE SNAPSHOT records (written by the Mac's hourly queue sync through
 *   the governed capture path) carry the REAL decision queue and the REAL
 *   healthcheck state. The Approval Inbox and the health dials read these.
 * - STATUS RECORD prose still feeds the hero + "Current runs" narrative,
 *   which is descriptive, not a control surface.
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

/* ---- Queue snapshot (the real decision queue + Mac health) ---- */

interface QueueSnapshot {
  generated_at: string;
  open_count: number;
  open_cards: { id: string; title: string; ask: string; opened: string }[];
  health: {
    line: string;
    healthy: boolean;
    checked_at: string;
    pending_capture_flags: number;
    escalation_inbox: number;
  };
}

// The Mac healthcheck runs twice daily and its log line timestamps change, so
// a fresh system produces a new snapshot at least every ~12h. Past 26h the
// snapshot pipeline itself is in trouble and the dials must say so.
const SNAPSHOT_STALE_MS = 26 * 3600 * 1000;

function parseQueueSnapshot(content: string): QueueSnapshot | null {
  try {
    const jsonLine = content
      .split("\n")
      .find((l) => l.trim().startsWith("{"));
    if (!jsonLine) return null;
    const parsed = JSON.parse(jsonLine) as QueueSnapshot;
    if (!parsed || typeof parsed.open_count !== "number" || !Array.isArray(parsed.open_cards)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getCockpitLive(apiKey: string): Promise<CockpitLive | null> {
  const res = await fetchThoughts(apiKey, {
    per_page: 100,
    sort: "created_at",
    order: "desc",
  });
  const rows = (res?.data ?? []) as Array<{ content?: string; created_at?: string; metadata?: { category?: string } }>;

  // Newest queue snapshot in the window (they are captured on change, at
  // least twice a day, so 100 newest records is a comfortable window).
  const snapshotRow = rows.find((r) => (r.content || "").trim().startsWith("QUEUE SNAPSHOT"));
  const snapshot = snapshotRow ? parseQueueSnapshot(snapshotRow.content || "") : null;
  const snapshotAgeMs = snapshot ? Date.now() - new Date(snapshot.generated_at).getTime() : Infinity;
  const snapshotFresh = snapshot !== null && snapshotAgeMs <= SNAPSHOT_STALE_MS;

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

  // Approvals: the REAL decision queue from the newest QUEUE SNAPSHOT (F3).
  // No more regex inference over BLOCKED BY prose — if the snapshot is
  // missing or stale, say so instead of guessing.
  const approvals = snapshotFresh
    ? snapshot!.open_cards.slice(0, 5).map((c) => ({
        title: clip(c.title, 80),
        why: "In your decision queue",
        plain: clip(c.ask, 200),
        tone: "attention" as Tone,
      }))
    : [
        {
          title: "Decision queue snapshot unavailable",
          why: snapshot ? "Snapshot is stale" : "No snapshot yet",
          plain: snapshot
            ? `The Mac last published its queue ${relTime(snapshot.generated_at)} ago — the hourly sync may be down. The Telegram digest and the Mac remain the source of truth.`
            : "The Mac has not published a queue snapshot to Company Memory yet. The Telegram digest and the Mac remain the source of truth.",
          tone: "info" as Tone,
        },
      ];

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

  const openCount = snapshotFresh ? snapshot!.open_count : null;

  const kpis = [
    {
      eyebrow: "Needs your approval",
      value: openCount === null ? "—" : String(openCount),
      caption:
        openCount === null
          ? "Queue snapshot unavailable — check the Telegram digest."
          : "Open cards in your decision queue, straight from the Mac.",
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

  // ---- System health (F4: real gauges, no hardcoded 100%) ----
  const total = res?.total ?? records.length;

  // Cheap probe of whether meaning-based (semantic) search is up.
  let aiOk = true;
  try {
    await searchThoughts(apiKey, "status", "semantic", 1);
  } catch {
    aiOk = false;
  }

  // Company Memory: this very page just read it, so "reachable" is a real
  // observation, not a hardcoded claim (if it were down we'd be in fallback).
  const memoryDial = {
    label: "Company Memory",
    pct: 100,
    caption: `Reachable · ${total.toLocaleString()} records`,
    accent: "#3ddc97",
  };

  const searchDial = {
    label: "Smart search",
    pct: aiOk ? 100 : 55,
    caption: aiOk ? "Meaning-based search on" : "Keyword only — AI credits low",
    accent: aiOk ? "#7c8cff" : "#ffb454",
  };

  // Mac healthcheck, from the queue snapshot: the real twice-daily check of
  // IP drift, VPS reach, Telegram gateway, pipeline, and backups.
  const macDial = !snapshot
    ? { label: "Mac healthcheck", pct: 20, caption: "No snapshot from the Mac yet", accent: "#ffb454" }
    : !snapshotFresh
      ? {
          label: "Mac healthcheck",
          pct: 45,
          caption: `Stale — last heard ${relTime(snapshot.generated_at)} ago`,
          accent: "#ffb454",
        }
      : snapshot.health.healthy
        ? {
            label: "Mac healthcheck",
            pct: 100,
            // The healthcheck line's own timestamp is Mac-local without a
            // timezone, so date the claim by the snapshot (UTC) instead.
            caption: `HEALTHY · as of snapshot ${relTime(snapshot.generated_at)} ago`,
            accent: "#3ddc97",
          }
        : {
            label: "Mac healthcheck",
            pct: 35,
            caption: clip(snapshot.health.line.replace(/^\[[^\]]*\]\s*/, ""), 70),
            accent: "#ff7a7a",
          };

  // Queue sync heartbeat: how recently the Mac published its queue state.
  const syncDial = !snapshot
    ? { label: "Queue sync", pct: 20, caption: "Waiting for the first snapshot", accent: "#ffb454" }
    : {
        label: "Queue sync",
        pct: snapshotFresh ? 100 : 45,
        caption: `Snapshot ${relTime(snapshot.generated_at)} old · ${snapshot.open_count} open card${snapshot.open_count === 1 ? "" : "s"}`,
        accent: snapshotFresh ? "#a78bfa" : "#ffb454",
      };

  const health = [memoryDial, searchDial, macDial, syncDial];

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
      status:
        openCount !== null && openCount > 0
          ? { label: "Needs you", tone: "attention" as Tone }
          : openCount === 0
            ? { label: "On track", tone: "good" as Tone }
            : { label: "Queue unknown", tone: "info" as Tone },
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
