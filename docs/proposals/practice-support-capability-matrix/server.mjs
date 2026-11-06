/**
 * Practice Support Capability Matrix — localhost prototype
 * Port 4179 · Woolloongabba Medical Centre proposal
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4179;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".prisma": "text/plain; charset=utf-8",
};

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, name), "utf8"));
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  const payload = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  const type = MIME[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, { error: "Not found" });
      return;
    }
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(data);
  });
}

const FORBIDDEN_PHRASES = [
  "we issue provider numbers",
  "guaranteed placement",
  "we approve your medicare",
  "visa approved by wmc",
];

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  const { pathname } = url;

  if (req.method === "GET" && pathname === "/api/capability-matrix") {
    try {
      const matrix = readJson("capability-matrix.json");
      const blob = JSON.stringify(matrix).toLowerCase();
      if (FORBIDDEN_PHRASES.some((p) => blob.includes(p))) {
        send(res, 500, { error: "Matrix failed trust-language check" });
        return;
      }
      send(res, 200, matrix);
    } catch (err) {
      send(res, 500, { error: String(err.message || err) });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/api/admin-checklist") {
    try {
      send(res, 200, readJson("admin-checklist.json"));
    } catch (err) {
      send(res, 500, { error: String(err.message || err) });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/api/status-model") {
    try {
      send(res, 200, readJson("status-model.json"));
    } catch (err) {
      send(res, 500, { error: String(err.message || err) });
    }
    return;
  }

  if (req.method === "GET" && pathname === "/health") {
    send(res, 200, { ok: true, service: "practice-support-capability-matrix", port: PORT });
    return;
  }

  let filePath = pathname === "/" ? "/index.html" : pathname;
  filePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, "");
  const absolute = path.join(__dirname, filePath);
  if (!absolute.startsWith(__dirname)) {
    send(res, 403, { error: "Forbidden" });
    return;
  }
  sendFile(res, absolute);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Practice Support Capability Matrix → http://127.0.0.1:${PORT}/`);
  console.log(`Admin checklist → http://127.0.0.1:${PORT}/admin.html`);
});
