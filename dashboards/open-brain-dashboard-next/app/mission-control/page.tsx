import "./cockpit.css";
import Cockpit from "@/components/mission-control/Cockpit";

export const metadata = {
  title: "Mission Control | HumeStone",
  description: "Stone's operating cockpit — redesign preview (Phase A)",
};

// Phase A is a static preview with sample data — render directly, no data fetch.
export default function MissionControlPage() {
  return <Cockpit />;
}
