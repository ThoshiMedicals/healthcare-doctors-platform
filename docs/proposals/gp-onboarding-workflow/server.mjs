/**
 * GP Onboarding Workflow — localhost prototype
 * Port 4180 · Human-reviewed gates only · no automated approvals
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4180;
const CASES_DIR = path.join(__dirname, "saved");
const FORBIDDEN_REVIEWERS = ["system", "auto", "automation", "bot", "scheduler", "cron"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".prisma": "text/plain; charset=utf-8",
};

if (!fs.existsSync(CASES_DIR)) fs.mkdirSync(CASES_DIR, { recursive: true });

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, name), "utf8"));
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  const payload = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(payload);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  const type = MIME[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, { error: "Not found" });
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(data);
  });
}

function loadCases() {
  const sample = readJson("examples/sample-case.json");
  const saved = fs
    .readdirSync(CASES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(CASES_DIR, f), "utf8")));
  const byId = new Map();
  byId.set(sample.id, sample);
  for (const c of saved) byId.set(c.id, c);
  return [...byId.values()];
}

function saveCase(c) {
  fs.writeFileSync(path.join(CASES_DIR, `${c.id}.json`), JSON.stringify(c, null, 2));
}

function findCase(id) {
  return loadCases().find((c) => c.id === id) || null;
}

function nextStageId(workflow, stageId) {
  const stages = workflow.stages.sort((a, b) => a.order - b.order);
  const idx = stages.findIndex((s) => s.id === stageId);
  if (idx < 0 || idx >= stages.length - 1) return null;
  return stages[idx + 1].id;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function applyGate(c, workflow, gate) {
  const stageId = gate.stageId;
  c.gates = c.gates || [];
  c.gates.push({
    stageId,
    decision: gate.decision,
    reviewerId: gate.reviewerId,
    reviewerName: gate.reviewerName,
    rationale: gate.rationale,
    createdAt: new Date().toISOString(),
  });

  c.stages = c.stages || [];
  let stage = c.stages.find((s) => s.stageId === stageId);
  if (!stage) {
    stage = { stageId, status: "in_progress" };
    c.stages.push(stage);
  }

  if (gate.decision === "approve_advance") {
    stage.status = "gate_approved";
    stage.gateApprovedAt = new Date().toISOString();
    if (stageId === "go_live") {
      c.status = "live";
    } else {
      const next = nextStageId(workflow, stageId);
      if (next) {
        c.currentStageId = next;
        c.status = "in_review";
        let ns = c.stages.find((s) => s.stageId === next);
        if (!ns) {
          ns = { stageId: next, status: "in_progress" };
          c.stages.push(ns);
        } else if (ns.status === "not_started") {
          ns.status = "in_progress";
        }
      }
    }
  } else if (gate.decision === "acknowledge_awaiting_external") {
    stage.status = "awaiting_external";
    c.status = "awaiting_external";
    c.providerNumberNote = gate.rationale;
  } else if (gate.decision === "pause") {
    c.status = "paused";
  } else if (gate.decision === "decline") {
    c.status = "declined";
  } else if (gate.decision === "request_changes") {
    stage.status = "awaiting_doctor";
    c.status = "awaiting_doctor";
  }

  c.updatedAt = new Date().toISOString();
  return c;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  const { pathname } = url;

  try {
    if (req.method === "GET" && pathname === "/health") {
      return send(res, 200, { ok: true, service: "gp-onboarding-workflow", port: PORT });
    }

    if (req.method === "GET" && pathname === "/api/workflow") {
      return send(res, 200, readJson("workflow.json"));
    }

    if (req.method === "GET" && pathname === "/api/notifications") {
      return send(res, 200, readJson("notification-model.json"));
    }

    if (req.method === "GET" && pathname === "/api/cases") {
      return send(res, 200, loadCases());
    }

    if (req.method === "GET" && pathname.startsWith("/api/cases/")) {
      const id = pathname.split("/")[3];
      const c = findCase(id);
      if (!c) return send(res, 404, { error: "Case not found" });
      return send(res, 200, c);
    }

    if (req.method === "POST" && pathname === "/api/cases") {
      const body = await readBody(req);
      const id = `case_${Date.now()}`;
      const c = {
        id,
        clinicId: "woolloongabba",
        doctorDisplayName: body.doctorDisplayName || "Dr New",
        doctorEmail: body.doctorEmail || null,
        careerApplicationId: body.careerApplicationId || null,
        status: "enquiry",
        currentStageId: "initial_discussion",
        workflowVersion: "1.0.0",
        stages: [{ stageId: "initial_discussion", status: "in_progress" }],
        tasks: [],
        gates: [],
        createdAt: new Date().toISOString(),
      };
      saveCase(c);
      return send(res, 201, c);
    }

    if (req.method === "POST" && /\/api\/cases\/[^/]+\/gates$/.test(pathname)) {
      const id = pathname.split("/")[3];
      const c = findCase(id);
      if (!c) return send(res, 404, { error: "Case not found" });
      const body = await readBody(req);
      const reviewerId = String(body.reviewerId || "").trim();
      const reviewerName = String(body.reviewerName || "").trim();
      const decision = String(body.decision || "").trim();
      const rationale = String(body.rationale || "").trim();
      const stageId = String(body.stageId || c.currentStageId).trim();

      if (!reviewerId || !reviewerName || !decision || !rationale) {
        return send(res, 400, {
          error: "Human gate requires reviewerId, reviewerName, decision, and rationale",
        });
      }
      if (FORBIDDEN_REVIEWERS.some((f) => reviewerId.toLowerCase().includes(f) || reviewerName.toLowerCase().includes(f))) {
        return send(res, 403, {
          error: "Automated or system reviewers cannot approve gates",
        });
      }

      const workflow = readJson("workflow.json");
      const updated = applyGate(c, workflow, {
        stageId,
        reviewerId,
        reviewerName,
        decision,
        rationale,
      });
      saveCase(updated);
      return send(res, 201, {
        ok: true,
        decision,
        reviewerName,
        case: updated,
      });
    }

    if (req.method === "PATCH" && /\/api\/cases\/[^/]+\/tasks\/[^/]+$/.test(pathname)) {
      const parts = pathname.split("/");
      const id = parts[3];
      const taskKey = parts[5];
      const c = findCase(id);
      if (!c) return send(res, 404, { error: "Case not found" });
      const body = await readBody(req);
      c.tasks = c.tasks || [];
      let task = c.tasks.find((t) => t.taskKey === taskKey);
      if (!task) {
        task = { taskKey, status: "pending", owner: "doctor", label: taskKey, required: true };
        c.tasks.push(task);
      }
      task.status = body.status || task.status;
      if (body.notes) task.notes = body.notes;
      if (task.status === "done") task.completedAt = new Date().toISOString();
      // Explicit: task completion never approves a gate
      saveCase(c);
      return send(res, 200, { ok: true, task, note: "Task updated; gate still requires human review" });
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

server.listen(PORT, "127.0.0.1", () => {
  console.log(`GP Onboarding Workflow → http://127.0.0.1:${PORT}/`);
  console.log(`Admin dashboard → http://127.0.0.1:${PORT}/dashboard.html`);
  console.log(`Doctor view → http://127.0.0.1:${PORT}/doctor.html`);
});
