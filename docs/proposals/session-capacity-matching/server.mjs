/**
 * Session-to-Capacity Matching Engine — localhost prototype
 * Port 4183
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { matchSessions, exampleMatch, evaluateWindow } from "./match-engine.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4183;

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

function capacityWithStatus() {
  const capacity = readJson("practice-capacity.json");
  const windows = (capacity.windows || []).map((w) => ({ ...w, ...evaluateWindow(w) }));
  return { ...capacity, windows };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  const { pathname } = url;

  try {
    if (req.method === "GET" && pathname === "/health") {
      return send(res, 200, { ok: true, service: "session-capacity-matching", port: PORT });
    }

    if (req.method === "GET" && pathname === "/api/capacity") {
      return send(res, 200, capacityWithStatus());
    }

    if (req.method === "GET" && pathname === "/api/matching-model") {
      return send(res, 200, readJson("matching-model.json"));
    }

    if (req.method === "GET" && pathname === "/api/admin-integration") {
      return send(res, 200, readJson("admin-integration.json"));
    }

    if (req.method === "POST" && pathname === "/api/match/example") {
      const capacity = readJson("practice-capacity.json");
      return send(res, 200, exampleMatch(capacity));
    }

    if (req.method === "POST" && pathname === "/api/match") {
      const body = await readBody(req);
      const preferred = body.preferredSessions || body.preferences || [];
      if (!Array.isArray(preferred) || !preferred.length) {
        return send(res, 400, { error: "preferredSessions array required" });
      }
      const capacity = readJson("practice-capacity.json");
      const result = matchSessions(capacity, preferred, {
        doctorDisplayName: body.doctorDisplayName,
        enquiryId: body.enquiryId,
      });
      return send(res, 200, result);
    }

    if (req.method === "GET" && pathname.startsWith("/api/match/enquiry/")) {
      const enquiryId = pathname.split("/")[4];
      const prefs = readJson("enquiry-prefs.json");
      const entry = prefs[enquiryId] || prefs.example;
      if (!entry) return send(res, 404, { error: "Enquiry preferences not found" });
      const capacity = readJson("practice-capacity.json");
      const result = matchSessions(capacity, entry.preferredSessions, {
        doctorDisplayName: entry.doctorDisplayName,
        enquiryId,
      });
      return send(res, 200, {
        ...result,
        enquiryId,
        adminDeepLink: `http://127.0.0.1:4183/?enquiryId=${encodeURIComponent(enquiryId)}`,
        integration: "admin-gp-enquiries-dashboard",
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
  console.log(`Session-to-Capacity Matching → http://127.0.0.1:${PORT}/`);
});
