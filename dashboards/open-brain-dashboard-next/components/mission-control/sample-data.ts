/*
 * Mission Control — Phase A sample data.
 * Static fixture so the redesign can be reviewed without wiring live data.
 * Content mirrors real HumeStone context so the preview feels real.
 * Phase B replaces this with live Company Memory reads.
 */

export type Tone = "good" | "attention" | "blocked" | "info" | "neutral";

export const TONE_HEX: Record<Tone, string> = {
  good: "#3ddc97",
  attention: "#ffb454",
  blocked: "#ff7a7a",
  info: "#7c8cff",
  neutral: "#a78bfa",
};

export const HERO = {
  name: "James",
  greeting: "Here's where Stone stands.",
  status: { label: "Needs you", tone: "attention" as Tone },
  workingOn: "Mission Control redesign · Phase A",
  updated: "8 min ago",
};

export type Kpi = {
  eyebrow: string;
  value: string;
  caption: string;
  accent: string;
  tone: Tone;
};

export const KPIS: Kpi[] = [
  {
    eyebrow: "Needs your approval",
    value: "2",
    caption: "Items waiting on your yes / no before Stone can proceed.",
    accent: "#ffb454",
    tone: "attention",
  },
  {
    eyebrow: "Active runs",
    value: "3",
    caption: "What Stone and its workers are doing right now.",
    accent: "#3ddc97",
    tone: "good",
  },
  {
    eyebrow: "Last verified",
    value: "8m",
    caption: "When Company Memory last confirmed everything is in sync.",
    accent: "#a78bfa",
    tone: "info",
  },
];

export type Approval = {
  title: string;
  why: string;
  plain: string;
  tone: Tone;
};

export const APPROVALS: Approval[] = [
  {
    title: "Deploy the dashboard timezone fix",
    why: "Production change to brain.humestone.com",
    plain: "A small fix so the memory detail page shows its panels correctly instead of breaking. The fix is already written.",
    tone: "attention",
  },
  {
    title: "Confirm the Test Kitchen candidate",
    why: "A business decision only you can make",
    plain: "Pick the founder/operator candidate and the workflow for the safer-AI-delegation lane so Stone can move it forward.",
    tone: "attention",
  },
];

export type Run = {
  title: string;
  state: "building" | "done" | "healthy";
  plain: string;
};

export const RUNS: Run[] = [
  {
    title: "Mission Control redesign — Phase A",
    state: "building",
    plain: "Building the new look you're seeing right now.",
  },
  {
    title: "Portal — security fix + Next 16 upgrade",
    state: "done",
    plain: "Both shipped and verified live on app.humestone.com today.",
  },
  {
    title: "Company Memory content pipeline",
    state: "healthy",
    plain: "Processing new source articles into the brain. 0 failed.",
  },
];

export type Gate = {
  label: string;
  state: string;
  plain: string;
  tone: Tone;
};

export const GATES: Gate[] = [
  {
    label: "Hermes provider retry",
    state: "Held",
    plain: "Paused until you approve a provider/key retry.",
    tone: "blocked",
  },
  {
    label: "Production deploys",
    state: "Gated",
    plain: "Stone always asks you before anything goes live.",
    tone: "attention",
  },
  {
    label: "Secrets & credentials",
    state: "Gated",
    plain: "No key or access changes without your explicit OK.",
    tone: "attention",
  },
];

export type Health = {
  label: string;
  pct: number;
  caption: string;
  accent: string;
};

export const HEALTH: Health[] = [
  { label: "Company Memory", pct: 100, caption: "Live & in sync", accent: "#3ddc97" },
  { label: "Workers", pct: 100, caption: "All idle / healthy", accent: "#7c8cff" },
  { label: "Content queue", pct: 100, caption: "0 failed items", accent: "#a78bfa" },
];

/* Ask Open Brain — Phase A shows a canned answer to demonstrate the feature.
   Phase C wires this to real natural-language queries over Company Memory. */
export const ASK_SUGGESTIONS = [
  "What repos have we added in the last 30 days?",
  "What did we ship this week?",
  "What's blocked and waiting on me?",
];

export const ASK_DEMO = {
  question: "What repos have we added in the last 30 days?",
  answer:
    "In the last 30 days you've added 3 repositories to HumeStone's GitHub: humestone-portal (the customer Portal — shipped a security fix and Next 16 upgrade today), the OB1 dashboard fork, and the Company Memory bridge. The Portal saw the most activity, with 39 pull requests.",
  sources: [
    "STATUS RECORD · Portal #38/#39 deploy · today",
    "STATUS RECORD · Tracks A/B sweep · Jun 3",
    "Entity · humestone-portal",
  ],
  note: "Preview answer — in the finished version this is generated live from Company Memory.",
};

/*
 * Spine navigation. Phase B: real destinations.
 * - Cockpit is the surface route (/mission-control).
 * - Approvals/Runs/Ask/Gates/System health jump to sections on the cockpit.
 * - Company Memory routes into the folded memory app (legacy chrome until Phase C).
 * - Evidence was removed 2026-07-03 (surface convergence F5): it never had a
 *   surface, and an inert nav item reads as a broken one. Re-add with a real
 *   href if an evidence surface ships.
 */
export const NAV = {
  primary: [
    { label: "Cockpit", icon: "◳", href: "/mission-control" },
    { label: "Approvals", icon: "✓", href: "/mission-control#approvals" },
    { label: "Runs", icon: "▷", href: "/mission-control#runs" },
    { label: "Ask Open Brain", icon: "✦", href: "/mission-control#ask" },
  ],
  surfaces: [
    { label: "Company Memory", icon: "◇", href: "/" },
    { label: "Gates", icon: "⊘", href: "/mission-control#gates" },
    { label: "System health", icon: "♥", href: "/mission-control#health" },
  ],
};
