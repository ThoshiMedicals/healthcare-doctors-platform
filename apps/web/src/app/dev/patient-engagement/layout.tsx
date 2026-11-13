import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isEngagementC1PrototypeRequestEnabled } from "@/engagement-c1/prototype-gate";

export const metadata: Metadata = {
  title: "Patient Engagement lab (demo) | Woolloongabba Medical Centre",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function PatientEngagementLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get("x-forwarded-host") ?? (await headers()).get("host");
  if (!isEngagementC1PrototypeRequestEnabled(host)) {
    notFound();
  }
  return children;
}
