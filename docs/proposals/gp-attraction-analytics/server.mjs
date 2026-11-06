/**
 * GP Attraction Analytics Dashboard — localhost prototype
 * Port 4181
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aggregate } from "./aggregate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4181;

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

function send(res, status, body, type = "application/json; charset=utf-8") {
  const payload = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(payload);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, { error: "Not found" });
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
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

const FORBIDDEN_KEYS = ["ahpra", "providerNumber", "passport", "cvText", "document"];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  const { pathname } = url;

  try {
    if (req.method === "GET" && pathname === "/health") {
      return send(res, 200, { ok: true, service: "gp-attraction-analytics", port: PORT });
    }

    if (req.method === "GET" && pathname === "/api/event-model") {
      return send(res, 200, readJson("event-model.json"));
    }

    if (req.method === "GET" && pathname === "/api/metrics-catalogue") {
      return send(res, 200, readJson("metrics-catalogue.json"));
    }

    if (req.method === "GET" && pathname === "/api/events") {
      return send(res, 200, readJson("seed-events.json"));
    }

    if (req.method === "GET" && pathname === "/api/summary") {
      const events = readJson("seed-events.json");
      const catalogue = readJson("metrics-catalogue.json");
      return send(res, 200, aggregate(events, catalogue.personaHints));
    }

    if (req.method === "POST" && pathname === "/api/events") {
      const body = await readBody(req);
      const blob = JSON.stringify(body).toLowerCase();
      if (FORBIDDEN_KEYS.some((k) => blob.includes(k.toLowerCase()) && body[k])) {
        return send(res, 400, { error: "PII-like fields are not accepted in analytics events" });
      }
      if (!body.name || !body.anonymousSessionId) {
        return send(res, 400, { error: "name and anonymousSessionId required" });
      }
      // Prototype: acknowledge ingest without mutating seed file permanently
      return send(res, 202, {
        ok: true,
        accepted: true,
        note: "Prototype accept-only; wire to GpAttractionEvent in production",
        event: body,
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
  console.log(`GP Attraction Analytics → http://127.0.0.1:${PORT}/`);
});
