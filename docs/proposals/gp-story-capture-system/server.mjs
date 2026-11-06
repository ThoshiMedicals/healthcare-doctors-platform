/**
 * GP Story Capture System — localhost prototype
 * Port 4197 · Human review gates only · no auto-publish
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4197);
const SAVED = path.join(__dirname, "saved");
const FORBIDDEN_REVIEWERS = ["system", "auto", "automation", "bot", "scheduler", "cron"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".prisma": "text/plain; charset=utf-8",
};

if (!fs.existsSync(SAVED)) fs.mkdirSync(SAVED, { recursive: true });

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, rel), "utf8"));
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  const payload = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(payload);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  const type = MIME[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, { error: "Not found" });
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(data);
  });
}

function inventoryPath() {
  return path.join(SAVED, "inventory.json");
}

function loadInventory() {
  const sample = readJson("examples/sample-inventory.json");
  if (fs.existsSync(inventoryPath())) {
    return JSON.parse(fs.readFileSync(inventoryPath(), "utf8"));
  }
  return structuredClone(sample);
}

function saveInventory(inv) {
  fs.writeFileSync(inventoryPath(), JSON.stringify(inv, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (err) {
        reject(err);
      }
    });
  });
}

const DECISION_STATUS = {
  approve_advance: "approved",
  request_changes: "drafting",
  pause: "paused",
  withdraw: "withdrawn",
  archive: "archived",
  approve_publish: "published",
  acknowledge_withdrawal: "withdrawn",
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const { pathname } = url;

  try {
    if (pathname === "/api/workflow") return send(res, 200, readJson("workflow.json"));
    if (pathname === "/api/schema") return sendFile(res, path.join(__dirname, "schema.prisma"));
    if (pathname === "/api/inventory") return send(res, 200, loadInventory());

    if (pathname === "/api/review" && req.method === "POST") {
      const body = await readBody(req);
      const reviewerId = String(body.reviewerId || "").trim();
      if (!reviewerId || FORBIDDEN_REVIEWERS.includes(reviewerId.toLowerCase())) {
        return send(res, 400, { error: "Named human reviewerId required (not system/auto)." });
      }
      if (!body.reviewerName || !body.rationale || !body.decision || !body.storyId) {
        return send(res, 400, { error: "storyId, decision, reviewerName, rationale required." });
      }

      const inv = loadInventory();
      const story = inv.stories.find((s) => s.id === body.storyId);
      if (!story) return send(res, 404, { error: "Story not found" });

      if (body.decision === "approve_advance") {
        if (story.status !== "editorial_review") {
          return send(res, 400, { error: "approve_advance only from editorial_review." });
        }
        const checklist = readJson("workflow.json").editorialReviewFlow.checklist.filter((c) => c.blocking);
        const snap = body.checklistSnapshot || {};
        const missing = checklist.filter((c) => snap[c.id] !== true).map((c) => c.id);
        if (missing.length) {
          return send(res, 400, { error: "Blocking checks incomplete", missing });
        }
        if (story.consent?.status !== "signed") {
          return send(res, 400, { error: "Signed consent required before approve." });
        }
      }

      const fromStatus = story.status;
      const toStatus = DECISION_STATUS[body.decision];
      if (!toStatus) return send(res, 400, { error: "Unknown decision" });

      story.status = toStatus;
      story.daysInStatus = 0;
      story.nextAction =
        toStatus === "approved"
          ? "Practice manager: plan placements then approve_publish"
          : toStatus === "drafting"
            ? "Editor: address requested changes"
            : toStatus === "paused"
              ? "Hold — resume when ready"
              : story.nextAction;

      const event = {
        id: `rev_${Date.now()}`,
        storyId: story.id,
        fromStatus,
        toStatus,
        decision: body.decision,
        reviewerRole: "brand_governance",
        reviewerId,
        reviewerName: body.reviewerName,
        rationale: body.rationale,
        checklistSnapshot: body.checklistSnapshot || null,
        createdAt: new Date().toISOString(),
      };

      const eventsFile = path.join(SAVED, "review-events.json");
      const events = fs.existsSync(eventsFile) ? JSON.parse(fs.readFileSync(eventsFile, "utf8")) : [];
      events.push(event);
      fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
      saveInventory(inv);
      return send(res, 200, { ok: true, event, inventory: inv });
    }

    let file = pathname === "/" ? "/index.html" : pathname;
    const safe = path.normalize(file).replace(/^(\.\.[/\\])+/, "");
    return sendFile(res, path.join(__dirname, safe));
  } catch (err) {
    return send(res, 500, { error: err.message || "Server error" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`GP Story Capture System prototype → http://127.0.0.1:${PORT}`);
});
