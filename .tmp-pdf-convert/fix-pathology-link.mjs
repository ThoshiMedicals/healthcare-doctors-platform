import fs from "fs";

const f = "old-html/services/pathology.html";
let html = fs.readFileSync(f, "utf8");
const heading = "<h3>Related services</h3>";
const hAt = html.indexOf(heading);
if (hAt < 0) throw new Error("heading missing");
const div = html.indexOf('class="resource-links"', hAt);
const blockEnd = html.indexOf("</div>", div);
const block = html.slice(div, blockEnd);
if (block.includes("test-results.html")) {
  console.log("already in related services");
  process.exit(0);
}
const link =
  '<a class="resource-link" href="../test-results.html"><span>Test Results</span><span aria-hidden="true">→</span></a>';
const afterOpen = html.indexOf(">", div) + 1;
html = html.slice(0, afterOpen) + link + html.slice(afterOpen);
fs.writeFileSync(f, html);
console.log("inserted");
console.log(html.slice(hAt, hAt + 550));
