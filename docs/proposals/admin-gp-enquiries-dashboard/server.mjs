/**
 * Admin GP Enquiries Dashboard — localhost prototype
 * Port 4182 · Human-reviewed; no automated hiring decisions
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4182;
const DATA = path.join(__dirname, "saved", "enquiries.json");
const SEED = path.join(__dirname, "seed-enquiries.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".prisma": "text/plain; charset=utf-8",
};

const ASSIGNEES = [
  { id: "pm_01", name: "Practice Manager" },
  { id: "principal_01", name: "Principal GP" },
];

function ensureData() {
  const dir = path.dirname(DATA);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA)) {
    fs.copyFileSync(SEED, DATA);
  }
}

function load() {
  ensureData();
  return JSON.parse(fs.readFileSync(DATA, "utf8"));
}

function save(rows) {
  ensureData();
  fs.writeFileSync(DATA, JSON.stringify(rows, null, 2));
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  const payload = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(payload);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, { error: "Not found" });
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8").replace(/^\uFEFF/, "") || "{}";
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function toListItem(e) {
  return {
    id: e.id,
    doctorDisplayName: e.doctorDisplayName,
    email: e.email,
    status: e.status,
    priorityScore: e.priorityScore,
    scoreBand: e.scoreBand,
    hardFlags: e.hardFlags || [],
    capacityFit: e.capacityFit,
    eligibilityDiscussionStatus: e.eligibilityDiscussionStatus,
    onboardingStage: e.onboardingStage,
    assignedToName: e.assignedToName,
    preferredStartDate: e.preferredStartDate,
    sessionsPerWeek: e.sessionsPerWeek,
    submittedAt: e.submittedAt,
    hasReadinessResult: Boolean(e.readiness),
    hasProviderReadiness: Boolean(e.providerReadiness),
    hasSessionPlan: Boolean(e.sessionPreferences),
  };
}

function filterSort(rows, url) {
  let out = [...rows];
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();
  const status = url.searchParams.get("status");
  const scoreBand = url.searchParams.get("scoreBand");
  const capacityFit = url.searchParams.get("capacityFit");
  const assigned = url.searchParams.get("assignedToUserId");
  const sort = url.searchParams.get("sort") || "priorityScore_desc";

  if (q) {
    out = out.filter(
      (e) =>
        e.doctorDisplayName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        String(e.phone || "").toLowerCase().includes(q)
    );
  }
  if (status) out = out.filter((e) => e.status === status);
  if (scoreBand) out = out.filter((e) => e.scoreBand === scoreBand);
  if (capacityFit) out = out.filter((e) => e.capacityFit === capacityFit);
  if (assigned === "unassigned") out = out.filter((e) => !e.assignedToUserId);
  else if (assigned) out = out.filter((e) => e.assignedToUserId === assigned);

  out.sort((a, b) => {
    // Hard flags first always
    const af = (a.hardFlags || []).length;
    const bf = (b.hardFlags || []).length;
    if (bf !== af) return bf - af;
    if (sort === "submittedAt_desc") return String(b.submittedAt).localeCompare(String(a.submittedAt));
    if (sort === "startDate_asc") {
      return String(a.preferredStartDate || "9999").localeCompare(String(b.preferredStartDate || "9999"));
    }
    return (b.priorityScore || 0) - (a.priorityScore || 0);
  });
  return out;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  const { pathname } = url;

  try {
    if (req.method === "GET" && pathname === "/health") {
      return send(res, 200, { ok: true, service: "admin-gp-enquiries-dashboard", port: PORT });
    }

    if (req.method === "GET" && pathname === "/api/meta") {
      return send(res, 200, {
        notice: "Priority score orders human review only — not an automated hire decision.",
        statuses: [
          "new_submission",
          "triage",
          "reviewing",
          "awaiting_doctor",
          "in_conversation",
          "onboarding",
          "nurture",
          "declined",
          "withdrawn",
          "hired",
        ],
        scoreBands: ["priority_review", "strong_fit", "possible_fit", "nurture", "incomplete"],
        capacityFits: ["strong", "limited", "uncertain", "unknown"],
        eligibilityStatuses: [
          "not_started",
          "in_discussion",
          "practice_location_shared",
          "doctor_seeking_external_advice",
          "paused",
          "closed_no_determination",
        ],
        assignees: ASSIGNEES,
      });
    }

    if (req.method === "GET" && pathname === "/api/enquiries") {
      const rows = filterSort(load(), url);
      return send(res, 200, {
        items: rows.map(toListItem),
        page: 1,
        total: rows.length,
        notice: "Priority score orders human review only — not an automated hire decision.",
      });
    }

    if (req.method === "GET" && pathname.startsWith("/api/enquiries/")) {
      const id = pathname.split("/")[3];
      const e = load().find((x) => x.id === id);
      if (!e) return send(res, 404, { error: "Not found" });
      return send(res, 200, e);
    }

    if (req.method === "PATCH" && pathname.startsWith("/api/enquiries/")) {
      const id = pathname.split("/")[3];
      const body = await readBody(req);
      if (!body.actorUserId) return send(res, 400, { error: "actorUserId required for human updates" });
      if (body.status === "hired" && body.humanConfirmation !== true) {
        return send(res, 403, {
          error: "Setting hired requires humanConfirmation=true. Hiring is never automated.",
        });
      }
      const rows = load();
      const idx = rows.findIndex((x) => x.id === id);
      if (idx < 0) return send(res, 404, { error: "Not found" });
      const e = rows[idx];
      const fromStatus = e.status;
      if (body.status) e.status = body.status;
      if (body.capacityFit) e.capacityFit = body.capacityFit;
      if (body.eligibilityDiscussionStatus) e.eligibilityDiscussionStatus = body.eligibilityDiscussionStatus;
      if (typeof body.eligibilityDiscussionSummary === "string") {
        e.eligibilityDiscussionSummary = body.eligibilityDiscussionSummary;
      }
      e.updatedAt = new Date().toISOString();
      e.audits = e.audits || [];
      e.audits.push({
        actorUserId: body.actorUserId,
        fromStatus,
        toStatus: e.status,
        note: body.note || null,
        createdAt: e.updatedAt,
      });
      rows[idx] = e;
      save(rows);
      return send(res, 200, e);
    }

    if (req.method === "POST" && /\/api\/enquiries\/[^/]+\/notes$/.test(pathname)) {
      const id = pathname.split("/")[3];
      const body = await readBody(req);
      if (!body.authorUserId || !body.body?.trim()) {
        return send(res, 400, { error: "authorUserId and body required" });
      }
      const rows = load();
      const idx = rows.findIndex((x) => x.id === id);
      if (idx < 0) return send(res, 404, { error: "Not found" });
      const note = {
        id: `note_${Date.now()}`,
        authorUserId: body.authorUserId,
        authorName: body.authorName || body.authorUserId,
        body: body.body.trim(),
        createdAt: new Date().toISOString(),
      };
      rows[idx].notes = rows[idx].notes || [];
      rows[idx].notes.unshift(note);
      save(rows);
      return send(res, 201, note);
    }

    if (req.method === "POST" && /\/api\/enquiries\/[^/]+\/assign$/.test(pathname)) {
      const id = pathname.split("/")[3];
      const body = await readBody(req);
      if (!body.actorUserId) return send(res, 400, { error: "actorUserId required" });
      const rows = load();
      const idx = rows.findIndex((x) => x.id === id);
      if (idx < 0) return send(res, 404, { error: "Not found" });
      const assignee = ASSIGNEES.find((a) => a.id === body.assigneeUserId) || null;
      rows[idx].assignedToUserId = assignee ? assignee.id : null;
      rows[idx].assignedToName = assignee ? assignee.name : null;
      rows[idx].updatedAt = new Date().toISOString();
      save(rows);
      return send(res, 200, toListItem(rows[idx]));
    }

    let filePath = pathname === "/" ? "/index.html" : pathname;
    filePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, "");
    const absolute = path.join(__dirname, filePath);
    if (!absolute.startsWith(__dirname)) return send(res, 403, { error: "Forbidden" });
    return sendFile(res, absolute);
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
});

ensureData();
server.listen(PORT, "127.0.0.1", () => {
  console.log(`Admin GP Enquiries Dashboard → http://127.0.0.1:${PORT}/`);
});
