import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WMC platform",
  description: "Staff infrastructure for the clinic platform.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
