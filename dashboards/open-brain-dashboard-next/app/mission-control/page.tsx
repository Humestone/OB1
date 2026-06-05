import "./cockpit.css";
import Cockpit from "@/components/mission-control/Cockpit";
import { getCockpitLive } from "@/lib/mission-control";

export const metadata = {
  title: "Mission Control | HumeStone",
  description: "Stone's operating cockpit",
};

// Always read fresh from Company Memory on load.
export const dynamic = "force-dynamic";

export default async function MissionControlPage() {
  // Read-only Company Memory access via the dashboard's server-side key.
  const apiKey = process.env.MCP_ACCESS_KEY;
  let live = null;
  if (apiKey) {
    try {
      live = await getCockpitLive(apiKey);
    } catch {
      live = null; // fall back to sample data
    }
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
