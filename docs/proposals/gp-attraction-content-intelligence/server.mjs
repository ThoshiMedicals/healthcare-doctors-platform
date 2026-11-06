/**
 * GP Attraction Content Intelligence Engine — localhost
 * Port 4185
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyseContentIntelligence } from "./intelligence-engine.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4185;
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
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8").replace(/^\uFEFF/, "") || "{}"));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

const FORBIDDEN_COPY = [/\b\d{2,3}\s*%\s*(split|bill)/i, /guaranteed earnings/i, /we issue provider numbers/i];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  const { pathname } = url;

  try {
    if (req.method === "GET" && pathname === "/health") {
      return send(res, 200, { ok: true, service: "gp-attraction-content-intelligence", port: PORT });
    }
    if (req.method === "GET" && pathname === "/api/model") {
      return send(res, 200, readJson("content-intelligence-model.json"));
    }
    if (req.method === "GET" && pathname === "/api/signals") {
      return send(res, 200, readJson("signals-snapshot.json"));
    }
    if (req.method === "GET" && pathname === "/api/insights") {
      const insights = analyseContentIntelligence(readJson("signals-snapshot.json"));
      return send(res, 200, insights);
    }
    if (req.method === "GET" && pathname === "/api/decisions") {
      ensureDecisions();
      return send(res, 200, { items: JSON.parse(fs.readFileSync(DECISIONS, "utf8")) });
    }
    if (req.method === "POST" && pathname === "/api/recommendations/decision") {
      const body = await readBody(req);
      if (!body.editorUserId || !String(body.rationale || "").trim() || !body.recommendationId) {
        return send(res, 400, { error: "editorUserId, recommendationId, and rationale required" });
      }
      if (/auto|system|bot/i.test(body.editorUserId)) {
        return send(res, 403, { error: "Automated publishers cannot accept content recommendations" });
      }
      if (body.suggestedCopy && FORBIDDEN_COPY.some((re) => re.test(body.suggestedCopy))) {
        return send(res, 400, { error: "Suggested copy fails brand/compliance guard (earnings % or PN issuance)" });
      }
      ensureDecisions();
      const rows = JSON.parse(fs.readFileSync(DECISIONS, "utf8"));
      const row = {
        id: `ced_${Date.now()}`,
        recommendationId: body.recommendationId,
        decision: body.decision || "accepted",
        editorUserId: body.editorUserId,
        editorName: body.editorName || body.editorUserId,
        rationale: String(body.rationale).trim(),
        createdAt: new Date().toISOString(),
      };
      rows.unshift(row);
      fs.writeFileSync(DECISIONS, JSON.stringify(rows, null, 2));
      return send(res, 201, {
        ok: true,
        decision: row,
        notice: "Editor decision recorded. No public page was published automatically.",
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
  console.log(`GP Attraction Content Intelligence → http://127.0.0.1:${PORT}/`);
});
