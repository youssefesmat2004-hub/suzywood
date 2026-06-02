import { createFileRoute } from "@tanstack/react-router";
import { CarpenterDashboard, CARPENTER_NAMES } from "@/components/carpenter/CarpenterDashboard";

export const Route = createFileRoute("/carpenter-dashboard-1")({
  ssr: false,
  component: () => <CarpenterDashboard carpenterId={1} carpenterName={CARPENTER_NAMES[1]} />,
});