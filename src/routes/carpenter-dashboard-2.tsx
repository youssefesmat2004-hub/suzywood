import { createFileRoute } from "@tanstack/react-router";
import { CarpenterDashboard, CARPENTER_NAMES } from "@/components/carpenter/CarpenterDashboard";

export const Route = createFileRoute("/carpenter-dashboard-2")({
  ssr: false,
  component: () => <CarpenterDashboard carpenterId={2} carpenterName={CARPENTER_NAMES[2]} />,
});