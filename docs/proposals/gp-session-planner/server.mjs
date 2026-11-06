/**
 * Localhost server — GP Session Planner
 * Usage: node server.mjs
 * Open: http://127.0.0.1:4175/
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4175);
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

/**
 * @param {http.IncomingMessage} req
 */
function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : null);
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

/**
 * @param {http.ServerResponse} res
 * @param {number} status
 * @param {unknown} data
 */
function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

/**
 * @param {string} urlPath
 */
function safeFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const rel = clean === "/" ? "/index.html" : clean;
  const abs = path.normalize(path.join(__dirname, rel));
  if (!abs.startsWith(__dirname)) return null;
  return abs;
}

/**
 * @param {unknown} payload
 */
function validatePlan(payload) {
  if (!payload || typeof payload !== "object") return "Invalid JSON body.";
  const p = /** @type {Record<string, any>} */ (payload);
  if (p.formType !== "gp_session_plan") return "Unsupported formType.";
  if (!Array.isArray(p.selectedSessions)) return "selectedSessions must be an array.";
  if (!p.totals || typeof p.totals.totalSessions !== "number") {
    return "Missing totals.totalSessions.";
  }
  if (typeof p.totals.estimatedCapacity !== "number") {
    return "Missing totals.estimatedCapacity.";
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const method = req.method || "GET";
  const url = req.url || "/";

  if (method === "POST" && url.startsWith("/api/gp-session-plan")) {
    try {
      const payload = await readJson(req);
      const error = validatePlan(payload);
      if (error) {
        sendJson(res, 400, { error });
        return;
      }
      const id = `session-plan-${Date.now()}`;
      const outPath = path.join(__dirname, "saved", `${id}.json`);
      fs.mkdirSync(path.join(__dirname, "saved"), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
      console.log(
        `\n[gp-session-plan] ${id} sessions=${payload.totals.totalSessions} capacity=${payload.totals.estimatedCapacity}`,
      );
      console.log(`saved → ${outPath}`);
      sendJson(res, 201, {
        id,
        ok: true,
        totalSessions: payload.totals.totalSessions,
        estimatedCapacity: payload.totals.estimatedCapacity,
        path: `saved/${id}.json`,
      });
    } catch {
      sendJson(res, 400, { error: "Malformed JSON." });
    }
    return;
  }

  if (method !== "GET" && method !== "HEAD") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const filePath = safeFile(url);
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  const ext = path.extname(filePath);
  const type = MIME[ext] || "application/octet-stream";
  const data = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": type,
    "Content-Length": data.length,
    "Cache-Control": "no-cache",
  });
  res.end(method === "HEAD" ? undefined : data);
});

server.listen(PORT, HOST, () => {
  console.log(`GP Session Planner → http://${HOST}:${PORT}/`);
  console.log(`POST endpoint      → http://${HOST}:${PORT}/api/gp-session-plan`);
});
