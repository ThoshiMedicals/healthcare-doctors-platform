import Link from "next/link";
import { C1_DEMO_BANNER } from "./prototype-gate";
import "./patient-demo.css";

export function DemoShell({
  title,
  lede,
  children,
  active,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
  active: "inbox" | "preferences" | "eligibility";
}) {
  return (
    <div className="wmc-c1">
      <div className="wmc-c1-banner" role="status">
        {C1_DEMO_BANNER}
      </div>
      <div className="wmc-c1-shell">
        <p className="wmc-c1-eyebrow">Woolloongabba Medical Centre · Patient Engagement lab</p>
        <h1>{title}</h1>
        <p className="wmc-c1-lede">{lede}</p>
        <nav className="wmc-c1-nav" aria-label="Engagement demo">
          <Link
            href="/dev/patient-engagement/inbox"
            aria-current={active === "inbox" ? "page" : undefined}
            className={active === "inbox" ? "wmc-c1-btn wmc-c1-btn-primary" : "wmc-c1-btn"}
          >
            Inbox
          </Link>
          <Link
            href="/dev/patient-engagement/preferences"
            aria-current={active === "preferences" ? "page" : undefined}
            className={active === "preferences" ? "wmc-c1-btn wmc-c1-btn-primary" : "wmc-c1-btn"}
          >
            Preferences
          </Link>
          <Link
            href="/dev/patient-engagement/eligibility"
            aria-current={active === "eligibility" ? "page" : undefined}
            className={active === "eligibility" ? "wmc-c1-btn wmc-c1-btn-primary" : "wmc-c1-btn"}
          >
            Eligibility
          </Link>
          <Link href="/patient-hub.html" className="wmc-c1-btn">
            Patient Hub
          </Link>
        </nav>
        {children}
        <p className="wmc-c1-footer-note">
          HotDoc remains the system for booking and appointment reminders. This lab does not send
          messages or create patient accounts.
        </p>
      </div>
    </div>
  );
}
