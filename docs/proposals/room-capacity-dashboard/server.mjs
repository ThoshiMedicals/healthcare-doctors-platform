/**
 * Localhost server — Room Capacity Dashboard
 * Usage: node server.mjs
 * Open: http://127.0.0.1:4176/
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4176);
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

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

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function safeFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const rel = clean === "/" ? "/index.html" : clean;
  const abs = path.normalize(path.join(__dirname, rel));
  if (!abs.startsWith(__dirname)) return null;
  return abs;
}

function validate(payload) {
  if (!payload || typeof payload !== "object") return "Invalid JSON body.";
  if (payload.formType !== "room_capacity_dashboard") return "Unsupported formType.";
  if (!payload.outputs?.availableCapacity) return "Missing availableCapacity.";
  if (!payload.outputs?.potentialPlacementOptions) return "Missing potentialPlacementOptions.";
  return null;
}

const server = http.createServer(async (req, res) => {
  const method = req.method || "GET";
  const url = req.url || "/";

  if (method === "POST" && url.startsWith("/api/room-capacity")) {
    try {
      const payload = await readJson(req);
      const error = validate(payload);
      if (error) {
        sendJson(res, 400, { error });
        return;
      }
      const id = `room-capacity-${Date.now()}`;
      const dir = path.join(__dirname, "saved");
      fs.mkdirSync(dir, { recursive: true });
      const outPath = path.join(dir, `${id}.json`);
      fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
      const free = payload.outputs.availableCapacity.roomSessionSlotsFree;
      console.log(`\n[room-capacity] ${id} freeSlots=${free}`);
      console.log(`saved → ${outPath}`);
      sendJson(res, 201, { id, ok: true, freeSlots: free, path: `saved/${id}.json` });
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
  console.log(`Room Capacity Dashboard → http://${HOST}:${PORT}/`);
  console.log(`POST endpoint           → http://${HOST}:${PORT}/api/room-capacity`);
});
