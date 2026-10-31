import fs from "node:fs";

const text = fs.readFileSync("old-html/digital-reception.js", "utf8");
const body = text.replace(/^\(\(\) => \{\r?\n?/, "").replace(/\r?\n?\}\)\(\);?\s*$/, "");
const launcherAt = body.indexOf("launcher=document.createElement('button')");
const before = body.slice(0, launcherAt);

// string-aware scan for top-level return
let depth = 0;
let mode = "code";
const returns = [];
for (let i = 0; i < before.length; i++) {
  const ch = before[i];
  const next = before[i + 1];
  if (mode === "code") {
    if (ch === "'") mode = "squote";
    else if (ch === '"') mode = "dquote";
    else if (ch === "`") mode = "template";
    else if (ch === "/" && next === "/") { mode = "linecomment"; i++; }
    else if (ch === "/" && next === "*") { mode = "blockcomment"; i++; }
    else if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (depth === 0 && before.startsWith("return", i) && /\breturn\b/.test(before.slice(i, i + 6))) {
      // check word boundary
      const prev = before[i - 1] || " ";
      if (!/[A-Za-z0-9_$]/.test(prev)) {
        returns.push({ i, snippet: before.slice(i, i + 80).replace(/\s+/g, " ") });
      }
    }
  } else if (mode === "squote") {
    if (ch === "\\") i++;
    else if (ch === "'") mode = "code";
  } else if (mode === "dquote") {
    if (ch === "\\") i++;
    else if (ch === '"') mode = "code";
  } else if (mode === "template") {
    if (ch === "\\") i++;
    else if (ch === "`") mode = "code";
  } else if (mode === "linecomment") {
    if (ch === "\n") mode = "code";
  } else if (mode === "blockcomment") {
    if (ch === "*" && next === "/") { mode = "code"; i++; }
  }
}
console.log("top-level returns before launcher:", returns.length);
for (const r of returns) console.log("-", r.snippet);

// Also check if measure is referenced before definition before launcher
console.log("\nmeasure refs before launcher", (before.match(/\bmeasure\s*\(/g) || []).length);
console.log("ResizeObserver before", before.includes("ResizeObserver"));

// Check whether site.js could create a decoy launcher
const site = fs.readFileSync("old-html/site.js", "utf8");
console.log("site mentions digital-reception-launcher", site.includes("digital-reception-launcher"));
const br = fs.existsSync("old-html/booking-resilience.js")
  ? fs.readFileSync("old-html/booking-resilience.js", "utf8")
  : "";
console.log("booking-resilience mentions launcher", br.includes("digital-reception"));
