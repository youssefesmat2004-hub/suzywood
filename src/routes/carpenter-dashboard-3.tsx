import { createFileRoute } from "@tanstack/react-router";
import { CarpenterDashboard, CARPENTER_NAMES } from "@/components/carpenter/CarpenterDashboard";

export const Route = createFileRoute("/carpenter-dashboard-3")({
  ssr: false,
  component: () => <CarpenterDashboard carpenterId={3} carpenterName={CARPENTER_NAMES[3]} />,
});