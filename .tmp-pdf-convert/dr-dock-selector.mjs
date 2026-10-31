import fs from "node:fs";
const c = fs.readFileSync("old-html/digital-reception.js", "utf8");
const L = c.indexOf("launcher=document.createElement('button')");
const chunk = c.slice(L, L + 4500);
console.log(chunk);

// Also search for dock selectors
for (const n of [
  "persistent-care-actions",
  "wmc-actions",
  "action-dock",
  "dockInner",
  "const dock",
]) {
  let i = 0, k = 0;
  while ((i = c.indexOf(n, i)) !== -1 && k < 5) {
    console.log("\nSEL", n, c.slice(i - 60, i + n.length + 100).replace(/\s+/g, " "));
    i += n.length; k++;
  }
}
