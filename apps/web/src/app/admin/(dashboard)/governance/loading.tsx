import { DashboardLoading } from "../dashboard-ui";

export default function Loading() {
  return <DashboardLoading label="Loading governance…" tiles={3} panels={1} />;
}