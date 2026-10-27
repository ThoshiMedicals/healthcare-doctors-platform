#!/usr/bin/env node
/**
 * L6 — Build / merge the measurement-events warehouse feed.
 *
 * Usage:
 *   node scripts/build-measurement-warehouse.mjs [input.json ...]
 *   node scripts/build-measurement-warehouse.mjs --from-stdin < capture.json
 *
 * Writes apps/web/data/measurement-events.json for loadMeasurementEvents().
 * Input may be an array of events or { events: [...] }.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "measurement-events.json");

const CORE = new Set([
  "page_view",
  "book_appointment_click",
  "call_clinic_click",
  "digital_reception_open",
  "digital_reception_search",
  "digital_reception_result_click",
  "task_shortcut_click",
]);

const QUERY_KEYS = new Set(["query", "raw_query", "search_query", "q", "searchText", "search_text"]);

function sanitize(raw) {
  if (!raw || typeof raw !== "object") return null;
  const event = String(raw.event || "").trim();
  if (!event) return null;
  const out = {
    event,
    measurement_version: String(raw.measurement_version || "2G"),
    ts: String(raw.ts || new Date().toISOString()),
    page_path: String(raw.page_path || ""),
    page_group: String(raw.page_group || "other"),
  };
  for (const key of [
    "session_id",
    "placement",
    "destination",
    "practitioner",
    "task",
    "surface",
    "intent_bucket",
    "result_type",
    "step",
  ]) {
    if (raw[key] != null && raw[key] !== "") out[key] = String(raw[key]);
  }
  if (typeof raw.result_count === "number") out.result_count = raw.result_count;
  else if (raw.result_count === null) out.result_count = null;
  for (const key of Object.keys(raw)) {
    if (QUERY_KEYS.has(key)) continue;
  }
  return out;
}

function eventKey(e) {
  return [e.event, e.ts, e.session_id || "", e.page_path || "", e.placement || "", e.intent_bucket || "", e.step || ""].join("|");
}

function loadEvents(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.events)) return parsed.events;
  throw new Error(`No events array in ${filePath}`);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  if (!chunks.length) return [];
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.events)) return parsed.events;
  throw new Error("stdin JSON must be an array or { events }");
}

function summarize(events) {
  const byEvent = {};
  for (const e of events) {
    byEvent[e.event] = (byEvent[e.event] || 0) + 1;
  }
  return byEvent;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--from-stdin");
  const useStdin = process.argv.includes("--from-stdin");
  let raw = [];

  if (fs.existsSync(OUT)) {
    try {
      raw = loadEvents(OUT);
    } catch {
      raw = [];
    }
  }

  for (const file of args) {
    raw = raw.concat(loadEvents(path.resolve(file)));
  }
  if (useStdin || (!args.length && !process.stdin.isTTY)) {
    raw = raw.concat(await readStdin());
  }

  const seen = new Set();
  const events = [];
  for (const row of raw) {
    const cleaned = sanitize(row);
    if (!cleaned) continue;
    const key = eventKey(cleaned);
    if (seen.has(key)) continue;
    seen.add(key);
    events.push(cleaned);
  }

  events.sort((a, b) => String(a.ts).localeCompare(String(b.ts)));

  const byEvent = summarize(events);
  const missingCore = [...CORE].filter((name) => !byEvent[name]);

  const payload = {
    measurement_version: "2G",
    generated_at: new Date().toISOString(),
    source: "warehouse_file",
    event_count: events.length,
    core_event_coverage: {
      present: [...CORE].filter((name) => byEvent[name]),
      missing: missingCore,
      counts: byEvent,
    },
    privacy: {
      dashboard_stores_raw_query: false,
      query_keys_stripped: true,
    },
    events,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        written: OUT,
        event_count: events.length,
        core_coverage: payload.core_event_coverage,
      },
      null,
      2
    )
  );

  if (missingCore.length) {
    console.error(`Warning: missing core 2G event types: ${missingCore.join(", ")}`);
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
