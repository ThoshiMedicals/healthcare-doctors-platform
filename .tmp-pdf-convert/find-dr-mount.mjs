import fs from "node:fs";
const code = fs.readFileSync("old-html/digital-reception.js", "utf8");
const needles = [
  "document.body",
  "appendChild(",
  "append(",
  "insertAdjacent",
  "prepend(",
  "launcher)",
  "panel)",
  "classList.add('is-open'",
  "body.append",
  "document.documentElement",
];
for (const n of needles) {
  let idx = 0;
  let c = 0;
  while ((idx = code.indexOf(n, idx)) !== -1 && c < 8) {
    console.log("\n---", n, "@", idx, "---");
    console.log(code.slice(Math.max(0, idx - 100), idx + n.length + 160).replace(/\s+/g, " "));
    idx += n.length;
    c++;
  }
  if (!c) console.log("\n(none)", n);
}

// Extract from launcher create to 800 chars after
const L = code.indexOf("launcher=document.createElement('button')");
console.log("\n\n==== LAUNCHER BLOCK ====\n");
console.log(code.slice(L, L + 1800).replace(/\s+/g, " "));
