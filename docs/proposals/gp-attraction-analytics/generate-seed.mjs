/**
 * Generates synthetic GP attraction analytics events for localhost demos.
 * No PII. Persona hints only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PERSONAS = [
  "early_career_gp",
  "established_gp_seeking_change",
  "returning_gp",
  "part_time_parent_gp",
  "special_interest_gp",
  "unknown",
];

const FAQ_IDS = [
  "nursing-support",
  "session-flexibility",
  "provider-numbers",
  "commercial-terms",
  "systems-hotdoc",
  "registrar-pathway",
];

function pick(arr, i) {
  return arr[i % arr.length];
}

function daysAgo(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, (n * 7) % 60, 0, 0);
  return d.toISOString();
}

const events = [];
let seq = 0;

function push(evt) {
  events.push({
    id: `evt_${++seq}`,
    clinicId: "woolloongabba",
    ...evt,
  });
}

// 120 opportunity sessions with tapering funnel
for (let i = 0; i < 120; i++) {
  const sid = `sess_${String(i + 1).padStart(4, "0")}`;
  const persona = pick(PERSONAS, i);
  const day = i % 28;
  const channel = pick(["organic_search", "direct", "referral", "email", "social"], i);

  push({
    name: "page_view",
    occurredAt: daysAgo(day, 9),
    anonymousSessionId: sid,
    surface: "gp_opportunities",
    path: "/gp-opportunities",
    personaHint: persona,
    channel,
    deviceClass: i % 3 === 0 ? "mobile" : "desktop",
  });

  // ~55% open FAQ
  if (i % 100 < 55) {
    push({
      name: "path_edge",
      occurredAt: daysAgo(day, 9),
      anonymousSessionId: sid,
      fromSurface: "gp_opportunities",
      toSurface: "gp_faq",
      personaHint: persona,
    });
    push({
      name: "faq_open",
      occurredAt: daysAgo(day, 10),
      anonymousSessionId: sid,
      surface: "gp_faq",
      faqId: pick(FAQ_IDS, i),
      personaHint: persona,
    });
    if (i % 4 === 0) {
      push({
        name: "faq_open",
        occurredAt: daysAgo(day, 10),
        anonymousSessionId: sid,
        surface: "gp_faq",
        faqId: pick(FAQ_IDS, i + 2),
        personaHint: persona,
      });
    }
  }

  // ~35% start readiness, ~22% complete
  if (i % 100 < 35) {
    push({
      name: "tool_start",
      occurredAt: daysAgo(day, 11),
      anonymousSessionId: sid,
      surface: "doctor_readiness",
      toolId: "doctor-readiness",
      personaHint: persona,
    });
    push({
      name: "tool_step_view",
      occurredAt: daysAgo(day, 11),
      anonymousSessionId: sid,
      toolId: "doctor-readiness",
      stepId: "registration",
      stepIndex: 1,
      personaHint: persona,
    });
    if (i % 100 < 22) {
      push({
        name: "tool_complete",
        occurredAt: daysAgo(day, 12),
        anonymousSessionId: sid,
        toolId: "doctor-readiness",
        surface: "doctor_readiness",
        durationMs: 180000 + i * 100,
        personaHint: persona,
      });
    } else {
      push({
        name: "tool_abandon",
        occurredAt: daysAgo(day, 12),
        anonymousSessionId: sid,
        toolId: "doctor-readiness",
        lastStepId: pick(["registration", "experience", "availability"], i),
        personaHint: persona,
      });
    }
  }

  // ~18% provider readiness complete
  if (i % 100 < 18) {
    push({
      name: "tool_start",
      occurredAt: daysAgo(day, 13),
      anonymousSessionId: sid,
      toolId: "provider-number-readiness",
      surface: "provider_number_readiness",
      personaHint: persona,
    });
    push({
      name: "tool_complete",
      occurredAt: daysAgo(day, 14),
      anonymousSessionId: sid,
      toolId: "provider-number-readiness",
      surface: "provider_number_readiness",
      personaHint: persona,
    });
  }

  // ~15% session planner complete
  if (i % 100 < 15) {
    push({
      name: "tool_start",
      occurredAt: daysAgo(day, 15),
      anonymousSessionId: sid,
      toolId: "gp-session-planner",
      surface: "gp_session_planner",
      personaHint: persona,
    });
    if (i % 100 < 12) {
      push({
        name: "tool_complete",
        occurredAt: daysAgo(day, 16),
        anonymousSessionId: sid,
        toolId: "gp-session-planner",
        surface: "gp_session_planner",
        personaHint: persona,
      });
    } else {
      push({
        name: "tool_abandon",
        occurredAt: daysAgo(day, 16),
        anonymousSessionId: sid,
        toolId: "gp-session-planner",
        lastStepId: "preferences",
        personaHint: persona,
      });
    }
  }

  // CTA + EOI with varied high-value paths
  if (i % 100 < 10) {
    push({
      name: "cta_click",
      occurredAt: daysAgo(day, 17),
      anonymousSessionId: sid,
      surface: "gp_opportunities",
      ctaId: "express_interest",
      targetSurface: "gp_eoi",
      personaHint: persona,
    });
    push({
      name: "eoi_start",
      occurredAt: daysAgo(day, 17),
      anonymousSessionId: sid,
      entrySurface: "gp_opportunities",
      personaHint: persona,
    });
  }
  if (i % 100 < 8) {
    const pathVariant = i % 4;
    if (pathVariant === 0) {
      push({
        name: "path_edge",
        occurredAt: daysAgo(day, 17),
        anonymousSessionId: sid,
        fromSurface: "gp_faq",
        toSurface: "doctor_readiness",
        personaHint: persona,
      });
      push({
        name: "path_edge",
        occurredAt: daysAgo(day, 18),
        anonymousSessionId: sid,
        fromSurface: "doctor_readiness",
        toSurface: "gp_eoi",
        personaHint: persona,
      });
    } else if (pathVariant === 1) {
      push({
        name: "path_edge",
        occurredAt: daysAgo(day, 18),
        anonymousSessionId: sid,
        fromSurface: "gp_opportunities",
        toSurface: "gp_eoi",
        personaHint: persona,
      });
    } else if (pathVariant === 2) {
      push({
        name: "path_edge",
        occurredAt: daysAgo(day, 17),
        anonymousSessionId: sid,
        fromSurface: "doctor_readiness",
        toSurface: "provider_number_readiness",
        personaHint: persona,
      });
      push({
        name: "path_edge",
        occurredAt: daysAgo(day, 18),
        anonymousSessionId: sid,
        fromSurface: "provider_number_readiness",
        toSurface: "gp_eoi",
        personaHint: persona,
      });
    } else {
      push({
        name: "path_edge",
        occurredAt: daysAgo(day, 17),
        anonymousSessionId: sid,
        fromSurface: "gp_faq",
        toSurface: "gp_session_planner",
        personaHint: persona,
      });
      push({
        name: "path_edge",
        occurredAt: daysAgo(day, 18),
        anonymousSessionId: sid,
        fromSurface: "gp_session_planner",
        toSurface: "gp_eoi",
        personaHint: persona,
      });
    }
    push({
      name: "eoi_submit",
      occurredAt: daysAgo(day, 18),
      anonymousSessionId: sid,
      eoiSubmissionId: `eoi_${sid}`,
      personaHint: persona,
      priorToolCompletions: ["doctor-readiness"].concat(
        i % 100 < 5 ? ["provider-number-readiness"] : []
      ),
    });
  }
}

fs.writeFileSync(path.join(__dirname, "seed-events.json"), JSON.stringify(events, null, 2));
console.log(`Wrote ${events.length} seed events`);
