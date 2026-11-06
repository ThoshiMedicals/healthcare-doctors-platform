/**
 * Localhost mock server for GP Expression of Interest.
 * Usage: node server.mjs
 * Open: http://127.0.0.1:4173/
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
};

const AHPRA_RE = /^MED\d{10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+61(?:4\d{8}|[2378]\d{8})$/;
const FELLOWSHIP = new Set(["yes", "no", "in_progress"]);
const INTERESTS = new Set([
  "womens_health",
  "skin_checks",
  "chronic_disease",
  "mental_health",
  "childrens_health",
  "procedural",
  "preventive_care",
  "other",
]);

/**
 * @param {unknown} body
 */
function validatePayload(body) {
  if (!body || typeof body !== "object") return "Invalid JSON body.";
  const b = /** @type {Record<string, any>} */ (body);
  if (b.formType !== "gp_expression_of_interest") return "Unsupported formType.";
  if (b.clinicSlug !== "woolloongabba") return "Unknown clinicSlug.";
  if (!b.applicant?.name || String(b.applicant.name).trim().length < 2) return "Invalid name.";
  if (!EMAIL_RE.test(String(b.applicant?.email || ""))) return "Invalid email.";
  if (!PHONE_RE.test(String(b.applicant?.phone || ""))) return "Invalid phone.";
  if (!AHPRA_RE.test(String(b.credentials?.ahpraRegistration || ""))) {
    return "Invalid AHPRA registration.";
  }
  if (!FELLOWSHIP.has(b.credentials?.racgpFellowship)) return "Invalid RACGP Fellowship.";
  if (!FELLOWSHIP.has(b.credentials?.acrrmFellowship)) return "Invalid ACRRM Fellowship.";
  if (!Array.isArray(b.preferences?.specialInterests) || !b.preferences.specialInterests.length) {
    return "Select at least one special interest.";
  }
  if (!b.preferences.specialInterests.every((x) => INTERESTS.has(x))) {
    return "Unknown special interest value.";
  }
  if (
    b.preferences.specialInterests.includes("other") &&
    !String(b.preferences.specialInterestsOther || "").trim()
  ) {
    return "Describe other special interest.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.preferences?.preferredStartDate || ""))) {
    return "Invalid preferred start date.";
  }
  if (b.privacy?.confirmed !== true) return "Privacy confirmation required.";
  return null;
}

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

  if (method === "POST" && url.startsWith("/api/gp-eoi")) {
    try {
      const payload = await readJson(req);
      const error = validatePayload(payload);
      if (error) {
        sendJson(res, 400, { error });
        return;
      }
      const id = `gp-eoi-${Date.now()}`;
      console.log("\n[gp-eoi] accepted", id);
      console.log(JSON.stringify(payload, null, 2));
      sendJson(res, 201, { id, ok: true });
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
  console.log(`GP EOI localhost → http://${HOST}:${PORT}/`);
  console.log(`POST endpoint   → http://${HOST}:${PORT}/api/gp-eoi`);
});
