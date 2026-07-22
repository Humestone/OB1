import "./cockpit.css";
import Cockpit from "@/components/mission-control/Cockpit";
import CockpitStatus from "@/components/mission-control/CockpitStatus";
import { getCockpitLive } from "@/lib/mission-control";
import { requireSessionOrRedirect } from "@/lib/auth";

export const metadata = {
  title: "Mission Control | HumeStone",
  description: "Stone's operating cockpit",
};

// Always read fresh from Company Memory on load.
export const dynamic = "force-dynamic";

/** Human-readable UTC stamp for "when we tried to reach Company Memory". */
function fetchedAtLabel(d: Date): string {
  return `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export default async function MissionControlPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Validate the session like the data pages do; the cockpit renders live
  // company status and must never load without a real logged-in session.
  const { apiKey } = await requireSessionOrRedirect();
  const params = await searchParams;

  // Design-iteration escape hatch: the sample cockpit renders ONLY when
  // explicitly requested (?preview=1) and labels itself as sample data.
  // It is never a fallback: a failed live read must look failed, not like
  // a healthy cockpit full of real-looking numbers.
  if (params.preview === "1") return <Cockpit />;

  let live;
  try {
    live = await getCockpitLive(apiKey);
  } catch {
    // Fetch/API failure: Company Memory could not be reached. Say exactly
    // that, with no fabricated section content anywhere.
    return (
      <CockpitStatus
        tone="blocked"
        pill="Company Memory unreachable"
        headline="Live status unavailable"
        plain="Stone couldn't reach Company Memory, so there is no real status to show. This screen stays blank instead of guessing. The Telegram digest and the Mac remain the source of truth."
        detail={`Last tried ${fetchedAtLabel(new Date())} · reload to try again.`}
        footerLabel="Offline · Company Memory unreachable"
        topbarLabel="Live status unavailable"
      />
    );
  }

  // Reachable but empty: zero STATUS RECORDs to build a cockpit from.
  if (!live) {
    return (
      <CockpitStatus
        tone="info"
        pill="Connected · no records"
        headline="No status records yet"
        plain="Company Memory is reachable but holds no STATUS RECORD entries, so there is no real status to show. The cockpit lights up as soon as the first one is captured."
        detail={`Checked ${fetchedAtLabel(new Date())}.`}
        footerLabel="Live · Company Memory empty"
        topbarLabel="No status records yet"
      />
    );
  }

  return (
    <Cockpit
      hero={live.hero}
      kpis={live.kpis}
      approvals={live.approvals}
      runs={live.runs}
      gates={live.gates}
      health={live.health}
      isLive
    />
  );
}
