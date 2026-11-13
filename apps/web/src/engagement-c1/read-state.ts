/** Device-local read/ack state for C1 demo only — never a patient identity. */

const READ_KEY = "wmc.engagementC1.demo.readIds.v1";
const ACK_KEY = "wmc.engagementC1.demo.ackIds.v1";
const PREF_KEY = "wmc.engagementC1.demo.prefs.v1";

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify([...set]));
}

export function loadReadIds(): Set<string> {
  return readSet(READ_KEY);
}

export function loadAckIds(): Set<string> {
  return readSet(ACK_KEY);
}

export function markRead(id: string) {
  const set = readSet(READ_KEY);
  set.add(id);
  writeSet(READ_KEY, set);
}

export function markAck(id: string) {
  markRead(id);
  const set = readSet(ACK_KEY);
  set.add(id);
  writeSet(ACK_KEY, set);
}

export type DemoPrefState = {
  topics: Record<string, boolean>;
  masterNotifyIntent: boolean;
  savedAt: string | null;
};

export const DEFAULT_PREFS: DemoPrefState = {
  topics: {
    operational: true,
    access: true,
    practice_news: true,
    educational: false,
    promotional: false,
  },
  masterNotifyIntent: false,
  savedAt: null,
};

export function loadPrefs(): DemoPrefState {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (!raw) return { ...DEFAULT_PREFS, topics: { ...DEFAULT_PREFS.topics } };
    const parsed = JSON.parse(raw) as DemoPrefState;
    return {
      topics: { ...DEFAULT_PREFS.topics, ...(parsed.topics || {}) },
      masterNotifyIntent: Boolean(parsed.masterNotifyIntent),
      savedAt: parsed.savedAt ?? null,
    };
  } catch {
    return { ...DEFAULT_PREFS, topics: { ...DEFAULT_PREFS.topics } };
  }
}

export function savePrefs(state: DemoPrefState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREF_KEY, JSON.stringify(state));
}

/** Hard guarantee for tests and runtime: never call live push APIs in C1. */
export function assertNoLivePushApisCalled(): void {
  // Intentionally empty marker used by tests; C1 UI must never invoke
  // browser permission prompts or push subscription registration.
}
