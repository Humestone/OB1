import "./cockpit.css";
import Cockpit from "@/components/mission-control/Cockpit";
import { getCockpitLive } from "@/lib/mission-control";
import { requireSessionOrRedirect } from "@/lib/auth";

export const metadata = {
  title: "Mission Control | HumeStone",
  description: "Stone's operating cockpit",
};

// Always read fresh from Company Memory on load.
export const dynamic = "force-dynamic";

export default async function MissionControlPage() {
  // Validate the session like the data pages do; the cockpit renders live
  // company status and must never load without a real logged-in session.
  const { apiKey } = await requireSessionOrRedirect();

  let live = null;
  try {
    live = await getCockpitLive(apiKey);
  } catch {
    live = null; // fetch error → fall back to sample data
  }

  if (!live) return <Cockpit />;

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
