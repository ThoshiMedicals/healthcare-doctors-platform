import { readFileSync } from "node:fs";

const files = [
  "old-html/knowledge/articles/living-with-diabetes-gp-monitoring-long-term-management.html",
  "old-html/knowledge/articles/diabetes-care-plans-explained.html",
  "old-html/knowledge/articles/heart-health-checks.html",
  "old-html/knowledge/articles/what-happens-during-a-mental-health-care-plan.html",
  "old-html/knowledge/diabetes.html",
  "old-html/knowledge/heart.html",
  "old-html/knowledge/mental-health.html",
];

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const ids = [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"[^>]*>/g)].map((m) => m[1]);
  const figs = [...html.matchAll(/src="([^"]*authority\/[^"]+)"/g)].map((m) => m[1].split("/").pop());
  const schema = (html.match(/<script\b[^>]*type="application\/ld\+json"/g) || []).length;
  console.log(JSON.stringify({
    file,
    bytes: html.length,
    head: html.includes("</head>"),
    ids,
    figs,
    schema,
    canonical: html.includes('rel="canonical"'),
    book: (html.match(/wmc-book-appointment/g) || []).length,
  }));
}
