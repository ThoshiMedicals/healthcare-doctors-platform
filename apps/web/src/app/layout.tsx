import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clinic CMS | Woolloongabba Medical Centre",
  description: "Staff infrastructure for the clinic platform.",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon.ico?v=hd-lockup-tm-caring-20261111a", sizes: "any" },
      { url: "/favicon-32x32.png?v=hd-lockup-tm-caring-20261111a", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=hd-lockup-tm-caring-20261111a", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png?v=hd-lockup-tm-caring-20261111a",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
