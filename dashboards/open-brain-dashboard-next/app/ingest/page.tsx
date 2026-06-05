import { IngestPageClient } from "./IngestPageClient";
import { isGovernanceReadOnly } from "@/lib/governance";

export default function AddToBrainPage() {
  const governanceReadOnly = isGovernanceReadOnly();

  return <IngestPageClient governanceReadOnly={governanceReadOnly} />;
}
