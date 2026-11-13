"use client";

import { useEffect, useState } from "react";
import { DEMO_PREFERENCE_TOPICS } from "./dummy-data";
import {
  DEFAULT_PREFS,
  loadPrefs,
  savePrefs,
  type DemoPrefState,
} from "./read-state";

/**
 * C1 preferences prototype.
 * Intentionally does not invoke browser notification permission or push subscription APIs.
 */
export function PreferencesClient() {
  const [state, setState] = useState<DemoPrefState>(DEFAULT_PREFS);
  const [savedNote, setSavedNote] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadPrefs());
    setHydrated(true);
  }, []);

  function toggleTopic(id: string) {
    setState((prev) => ({
      ...prev,
      topics: { ...prev.topics, [id]: !prev.topics[id] },
    }));
  }

  function save() {
    const next = { ...state, savedAt: new Date().toISOString() };
    savePrefs(next);
    setState(next);
    setSavedNote(
      next.masterNotifyIntent
        ? "Preferences saved for this demonstration. Browser notification permission was not requested."
        : "Preferences saved for this demonstration. Master notify remains off — no permission prompt.",
    );
  }

  if (!hydrated) {
    return <p className="wmc-c1-lede">Loading preferences…</p>;
  }

  return (
    <>
      <section className="wmc-c1-panel" aria-labelledby="c1-optin-title">
        <h2 id="c1-optin-title">Why we may ask for notifications later</h2>
        <p style={{ margin: 0, lineHeight: 1.5, fontSize: "0.925rem" }}>
          When this programme goes live, you would choose topics first, then we would ask your browser
          for permission only after you save. HotDoc still handles appointment reminders. Browser
          permission alone is not marketing consent.
        </p>
        <div className="wmc-c1-switch-row">
          <div>
            <strong>Allow browser notifications (intent only)</strong>
            <p>Demonstration toggle — does not open the system permission dialog.</p>
          </div>
          <button
            type="button"
            className="wmc-c1-switch"
            role="switch"
            aria-checked={state.masterNotifyIntent}
            aria-label="Allow browser notifications intent"
            onClick={() =>
              setState((prev) => ({ ...prev, masterNotifyIntent: !prev.masterNotifyIntent }))
            }
          />
        </div>
      </section>

      <section className="wmc-c1-panel" aria-labelledby="c1-topics-title">
        <h2 id="c1-topics-title">Topics</h2>
        {DEMO_PREFERENCE_TOPICS.map((topic) => (
          <div className="wmc-c1-switch-row" key={topic.id}>
            <div>
              <strong>{topic.label}</strong>
              <p>
                {topic.description}
                {topic.requiresPromotionalConsent ? " Requires optional consent when live." : ""}
              </p>
            </div>
            <button
              type="button"
              className="wmc-c1-switch"
              role="switch"
              aria-checked={Boolean(state.topics[topic.id])}
              aria-label={topic.label}
              onClick={() => toggleTopic(topic.id)}
            />
          </div>
        ))}
      </section>

      <div className="wmc-c1-detail-actions">
        <button type="button" className="wmc-c1-btn wmc-c1-btn-primary" onClick={save}>
          Save preferences
        </button>
      </div>
      <p className="wmc-c1-live" aria-live="polite">
        {savedNote}
      </p>
      {state.savedAt ? (
        <p className="wmc-c1-footer-note">Last saved (this device demo): {state.savedAt}</p>
      ) : null}
    </>
  );
}
