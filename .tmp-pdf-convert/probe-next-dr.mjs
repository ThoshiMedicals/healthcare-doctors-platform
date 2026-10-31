import fs from "node:fs";
import { createHash } from "node:crypto";

const urls = [
  "http://127.0.0.1:3100/join-our-team.html",
  "https://next.gabbamedicalcentre.com.au/join-our-team.html",
  "http://127.0.0.1:3100/digital-reception.js",
  "https://next.gabbamedicalcentre.com.au/digital-reception.js",
];

for (const url of urls) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  const hash = createHash("sha256").update(text).digest("hex").slice(0, 12);
  console.log("\n", url);
  console.log("status", res.status, "len", text.length, "hash", hash);
  if (url.endsWith(".html")) {
    const scripts = [...text.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
    console.log("scripts", scripts);
    console.log("has DR script tag", scripts.some((s) => s.includes("digital-reception")));
    console.log("has dock", text.includes("persistent-care-actions"));
  } else {
    console.log("lines", text.split(/\r?\n/).length);
    console.log("starts", JSON.stringify(text.slice(0, 80)));
    // syntax check
    try {
      const { Script } = await import("node:vm");
      new Script(text);
      console.log("syntax OK");
    } catch (e) {
      console.log("syntax FAIL", e.message);
    }
  }
}

// Compare disk vs served
const disk = fs.readFileSync("old-html/digital-reception.js", "utf8");
const served = await fetch("http://127.0.0.1:3100/digital-reception.js", { cache: "no-store" }).then((r) => r.text());
console.log("\ndisk len", disk.length, "hash", createHash("sha256").update(disk).digest("hex").slice(0, 12));
console.log("served==disk", disk.replace(/\r\n/g, "\n") === served.replace(/\r\n/g, "\n"));
console.log("disk lines", disk.split(/\r?\n/).length);
