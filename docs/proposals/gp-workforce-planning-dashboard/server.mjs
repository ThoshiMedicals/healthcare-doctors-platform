/**
 * GP Workforce Planning Dashboard — localhost prototype
 * Port 4184 · Human decision-making only
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildWorkforcePlan } from "./planning-engine.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4184;
const DECISIONS = path.join(__dirname, "saved", "decisions.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".prisma": "text/plain; charset=utf-8",
};

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, name), "utf8"));
}

function ensureDecisions() {
  const dir = path.dirname(DECISIONS);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DECISIONS)) fs.writeFileSync(DECISIONS, "[]");
}

function loadDecisions() {
  ensureDecisions();
  return JSON.parse(fs.readFileSync(DECISIONS, "utf8"));
}

function saveDecisions(rows) {
  ensureDecisions();
  fs.writeFileSync(DECISIONS, JSON.stringify(rows, null, 2));
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

function plan(scenario) {
  const inputs = readJson("inputs-snapshot.json");
  return buildWorkforcePlan({
    ...inputs,
    scenario: scenario || inputs.scenario || "moderate",
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  const { pathname } = url;

  try {
    if (req.method === "GET" && pathname === "/health") {
      return send(res, 200, { ok: true, service: "gp-workforce-planning-dashboard", port: PORT });
    }

    if (req.method === "GET" && pathname === "/api/model") {
      return send(res, 200, readJson("planning-model.json"));
    }

    if (req.method === "GET" && pathname === "/api/inputs") {
      return send(res, 200, readJson("inputs-snapshot.json"));
    }

    if (req.method === "GET" && pathname === "/api/plan") {
      const scenario = url.searchParams.get("scenario") || "moderate";
      if (!["stable", "moderate", "pressure"].includes(scenario)) {
        return send(res, 400, { error: "scenario must be stable|moderate|pressure" });
      }
      return send(res, 200, plan(scenario));
    }

    if (req.method === "GET" && pathname === "/api/decisions") {
      return send(res, 200, { items: loadDecisions() });
    }

    if (req.method === "POST" && pathname === "/api/decisions") {
      const body = await readBody(req);
      if (!body.actorUserId || !String(body.rationale || "").trim()) {
        return send(res, 400, { error: "Human decision requires actorUserId and rationale" });
      }
      if (String(body.actorUserId).toLowerCase().includes("auto") || String(body.actorUserId).toLowerCase().includes("system")) {
        return send(res, 403, { error: "Automated actors cannot record workforce decisions" });
      }
      const row = {
        id: `dec_${Date.now()}`,
        decisionType: body.decisionType || "defer",
        recommendationId: body.recommendationId || null,
        actorUserId: body.actorUserId,
        actorName: body.actorName || body.actorUserId,
        rationale: String(body.rationale).trim(),
        createdAt: new Date().toISOString(),
      };
      const rows = loadDecisions();
      rows.unshift(row);
      saveDecisions(rows);
      return send(res, 201, {
        ok: true,
        decision: row,
        notice: "Decision recorded. No hire/roster side effects were applied.",
      });
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
  console.log(`GP Workforce Planning Dashboard → http://127.0.0.1:${PORT}/`);
});
