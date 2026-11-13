import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isEngagementC1PrototypeRequestEnabled } from "@/engagement-c1/prototype-gate";

export const dynamic = "force-dynamic";

export default async function EngagementLabLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!isEngagementC1PrototypeRequestEnabled(host)) {
    notFound();
  }
  return children;
}
