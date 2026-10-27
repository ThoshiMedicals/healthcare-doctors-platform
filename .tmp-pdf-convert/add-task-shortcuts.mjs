import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project";
const oldHtml = path.join(root, "old-html");
const tasks = [
  ["New Patient", "new-patients.html"],
  ["Repeat Script", "repeat-scripts.html"],
  ["Test Results", "test-results.html"],
  ["Referral", "referrals.html"],
  ["Skin Check", "services/skin-checks.html"],
  ["HotDoc Messages", "identifying-hotdoc-scam-messages.html"],
];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".pgdata" || ent.name === ".next") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else if (ent.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function routeOf(file) {
  const normal = file.replaceAll("\\", "/");
  if (normal.endsWith("/apps/web/public/index.html")) return "index.html";
  return path.relative(oldHtml, file).replaceAll("\\", "/");
}

function hrefFor(route, target) {
  const from = path.posix.dirname(route);
  const href = path.posix.relative(from === "." ? "" : from, target);
  return href || target;
}

function markup(route) {
  const links = tasks.map(([label, target]) => {
    const current = route === target ? ' aria-current="page"' : "";
    return `<a href="${hrefFor(route, target)}"${current}>${label}</a>`;
  }).join("");
  return `<div class="patient-tasks" role="group" aria-labelledby="patient-tasks-label"><span class="patient-tasks-label" id="patient-tasks-label">Find Information</span>${links}</div>`;
}

const files = [...walk(oldHtml), path.join(root, "apps/web/public/index.html")];
const navRe = /<nav aria-label="Primary navigation" id="primary-nav" class="shell"[^>]*>/;
let changed = 0;
const skipped = [];
const missing = [];

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  if (original.includes('class="patient-tasks"')) {
    skipped.push(routeOf(file));
    continue;
  }
  const match = original.match(navRe);
  if (!match) {
    missing.push(routeOf(file));
    continue;
  }
  const insertAt = match.index + match[0].length;
  const next = original.slice(0, insertAt) + markup(routeOf(file)) + original.slice(insertAt);
  fs.writeFileSync(file, next);
  changed += 1;
}

console.log(JSON.stringify({ files: files.length, changed, skipped, missing }, null, 2));
