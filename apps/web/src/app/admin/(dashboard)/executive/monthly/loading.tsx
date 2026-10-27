import { DashboardLoading } from "../../dashboard-ui";

export default function Loading() {
  return <DashboardLoading label="Loading monthly executive report…" tiles={4} panels={2} />;
}