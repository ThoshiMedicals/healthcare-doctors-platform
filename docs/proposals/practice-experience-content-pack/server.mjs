/**
 * Practice Experience Content Pack — localhost browser
 * Port 4198
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4198);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  let file = url.pathname === "/" ? "/index.html" : url.pathname;
  const safe = path.normalize(file).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(__dirname, safe);
  const ext = path.extname(full);
  fs.readFile(full, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Practice Experience content pack → http://127.0.0.1:${PORT}`);
});
