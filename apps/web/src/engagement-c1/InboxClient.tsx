"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  DEMO_PUBLISHED_INBOX,
  categoryLabel,
} from "./dummy-data";
import { loadAckIds, loadReadIds, markAck, markRead } from "./read-state";
import type { DemoAnnouncement, EngagementCategory } from "./types";

type Filter = "all" | "unread" | EngagementCategory;

function formatWhen(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function InboxClient({ detailId }: { detailId?: string }) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [ackIds, setAckIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [liveMessage, setLiveMessage] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedRead = loadReadIds();
    const storedAck = loadAckIds();
    // Seed defaults: items marked demoUnreadDefault stay unread until opened.
    for (const item of DEMO_PUBLISHED_INBOX) {
      if (!item.demoUnreadDefault) storedRead.add(item.id);
    }
    setReadIds(storedRead);
    setAckIds(storedAck);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !detailId) return;
    markRead(detailId);
    setReadIds(loadReadIds());
    setLiveMessage("Marked as read");
  }, [detailId, hydrated]);

  const detail = useMemo(
    () => DEMO_PUBLISHED_INBOX.find((row) => row.id === detailId),
    [detailId],
  );

  const filtered = useMemo(() => {
    return DEMO_PUBLISHED_INBOX.filter((row) => {
      const unread = !readIds.has(row.id);
      if (filter === "all") return true;
      if (filter === "unread") return unread;
      return row.category === filter;
    });
  }, [filter, readIds]);

  if (detailId) {
    if (!detail) {
      return (
        <div className="wmc-c1-empty" role="status">
          <p>That demonstration notice was not found.</p>
          <p>
            <Link href="/dev/patient-engagement/inbox">Back to inbox</Link>
          </p>
        </div>
      );
    }
    return (
      <DetailView
        item={detail}
        acknowledged={ackIds.has(detail.id)}
        onAck={() => {
          markAck(detail.id);
          setAckIds(loadAckIds());
          setReadIds(loadReadIds());
          setLiveMessage("Thanks — marked as got it");
        }}
        liveMessage={liveMessage}
      />
    );
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "operational", label: "Hours" },
    { id: "access", label: "Access" },
    { id: "practice_news", label: "News" },
    { id: "educational", label: "Education" },
  ];

  return (
    <>
      <div className="wmc-c1-filters" role="toolbar" aria-label="Filter notices">
        {filters.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className="wmc-c1-chip"
            aria-pressed={filter === chip.id}
            onClick={() => setFilter(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <p className="wmc-c1-live" aria-live="polite">
        {liveMessage}
      </p>
      {!hydrated ? (
        <p className="wmc-c1-lede">Loading demonstration inbox…</p>
      ) : filtered.length === 0 ? (
        <div className="wmc-c1-empty" role="status">
          <p>
            No notices in this filter. You can still view practice information on our website or open
            the Patient Hub.
          </p>
          <p>
            <Link href="/patient-hub.html">Go to Patient Hub</Link>
          </p>
        </div>
      ) : (
        <ul className="wmc-c1-list">
          {filtered.map((item) => {
            const unread = !readIds.has(item.id);
            return (
              <li key={item.id}>
                <Link
                  href={`/dev/patient-engagement/inbox/${item.id}`}
                  className="wmc-c1-row"
                  data-unread={unread ? "true" : "false"}
                  aria-label={`${item.title}. ${unread ? "Unread. " : "Read. "}${item.summary}`}
                >
                  <span className="wmc-c1-dot" aria-hidden="true" />
                  <span>
                    <h2>{item.title}</h2>
                    <p className="wmc-c1-meta">
                      {categoryLabel(item.category)}
                      {item.publishedAt ? ` · ${formatWhen(item.publishedAt)}` : null}
                      {unread ? " · Unread" : ""}
                    </p>
                    <p className="wmc-c1-summary">{item.summary}</p>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function DetailView({
  item,
  acknowledged,
  onAck,
  liveMessage,
}: {
  item: DemoAnnouncement;
  acknowledged: boolean;
  onAck: () => void;
  liveMessage: string;
}) {
  return (
    <article className="wmc-c1-panel" aria-labelledby="c1-detail-title">
      <p className="wmc-c1-meta">
        {categoryLabel(item.category)}
        {item.publishedAt ? ` · Published ${formatWhen(item.publishedAt)}` : null}
        {item.expiresAt ? ` · Expires ${formatWhen(item.expiresAt)}` : null}
      </p>
      <h2 id="c1-detail-title">{item.title}</h2>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, fontSize: "0.95rem" }}>{item.body}</div>
      <div className="wmc-c1-detail-actions">
        {item.actionHref && item.actionLabel ? (
          <Link className="wmc-c1-btn wmc-c1-btn-primary" href={item.actionHref}>
            {item.actionLabel}
          </Link>
        ) : null}
        <button
          type="button"
          className="wmc-c1-btn"
          onClick={onAck}
          disabled={acknowledged}
          aria-pressed={acknowledged}
        >
          {acknowledged ? "Got it (saved)" : "Got it"}
        </button>
        <Link className="wmc-c1-btn" href="/dev/patient-engagement/inbox">
          Back to inbox
        </Link>
      </div>
      <p className="wmc-c1-live" aria-live="polite">
        {liveMessage}
      </p>
    </article>
  );
}
