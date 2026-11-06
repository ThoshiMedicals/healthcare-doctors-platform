/**
 * Localhost — DPA & 19AB Eligibility Navigator
 * node server.mjs → http://127.0.0.1:4178/
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4178);
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
  if (!payload || payload.formType !== "dpa_19ab_eligibility_navigator") {
    return "Unsupported formType.";
  }
  const d = payload.disclaimers;
  if (
    !d?.notEligibilityDetermination ||
    !d?.notLegalAdvice ||
    !d?.notMigrationAdvice
  ) {
    return "Disclaimers required: not eligibility, not legal advice, not migration advice.";
  }
  if (!payload.outputs?.pathwaySummary || !payload.outputs?.recommendedNextAction) {
    return "Missing pathway outputs.";
  }
  // Reject advisory language in next action title
  const blob = JSON.stringify(payload.outputs).toLowerCase();
  if (/\byou are (not )?eligible\b|\beligible for medicare\b/.test(blob)) {
    return "Result must not determine eligibility.";
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const method = req.method || "GET";
  const url = req.url || "/";

  if (method === "POST" && url.startsWith("/api/dpa-19ab-navigator")) {
    try {
      const payload = await readJson(req);
      const error = validate(payload);
      if (error) {
        sendJson(res, 400, { error });
        return;
      }
      const id = `dpa19ab-${Date.now()}`;
      const dir = path.join(__dirname, "saved");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(payload, null, 2), "utf8");
      console.log(`\n[dpa-19ab-navigator] ${id} themes=${(payload.outputs.pathwayThemes || []).join(",")}`);
      sendJson(res, 201, { id, ok: true, path: `saved/${id}.json` });
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
  const data = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Length": data.length,
    "Cache-Control": "no-cache",
  });
  res.end(method === "HEAD" ? undefined : data);
});

server.listen(PORT, HOST, () => {
  console.log(`DPA/19AB Navigator → http://${HOST}:${PORT}/`);
});
