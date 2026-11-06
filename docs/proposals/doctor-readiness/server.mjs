/**
 * Localhost server — Doctor Readiness Assessment
 * Usage: node server.mjs
 * Open: http://127.0.0.1:4174/
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4174);
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

const server = http.createServer(async (req, res) => {
  const method = req.method || "GET";
  const url = req.url || "/";

  if (method === "POST" && url.startsWith("/api/doctor-readiness")) {
    try {
      const payload = await readJson(req);
      if (!payload || payload.formType !== "doctor_readiness_assessment") {
        sendJson(res, 400, { error: "Invalid assessment payload." });
        return;
      }
      if (typeof payload.readinessScore !== "number") {
        sendJson(res, 400, { error: "Missing readinessScore." });
        return;
      }
      const id = `readiness-${Date.now()}`;
      console.log(`\n[doctor-readiness] ${id} score=${payload.readinessScore} band=${payload.readinessBand}`);
      console.log(JSON.stringify(payload, null, 2));
      sendJson(res, 201, { id, ok: true, readinessScore: payload.readinessScore });
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
  console.log(`Doctor Readiness → http://${HOST}:${PORT}/`);
  console.log(`POST endpoint    → http://${HOST}:${PORT}/api/doctor-readiness`);
});
