import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { goldenHtmlRoot, listHtmlFiles, webRoot } from "@/importer/golden-root";

// Page scope taken from WMC_Post_Recovery_Functional_QA_Kit/source_findings.csv.
const affected = [
  "services/childrens-health.html",
  "services/chronic-disease-care.html",
  "services/family-health.html",
  "services/mens-health.html",
  "services/mental-health.html",
  "knowledge/articles/childhood-vaccinations-explained.html",
  "knowledge/articles/childrens-preventive-healthcare.html",
  "knowledge/articles/common-childhood-illnesses.html",
  "knowledge/articles/living-with-diabetes-gp-monitoring-long-term-management.html",
  "knowledge/articles/managing-winter-respiratory-illness.html",
  "knowledge/articles/preparing-for-your-childs-first-gp-appointment.html",
  "knowledge/articles/what-happens-during-a-mental-health-care-plan.html",
  "knowledge/articles/when-should-i-be-concerned-about-a-fever.html",
  "team-general-practitioners.html"
] as const;
const missing = "dr-gemunu-suresh-ranawake.html";
const read = (p: string) => fs.readFileSync(path.join(goldenHtmlRoot(), p), "utf8");

test("CSV-authorised obsolete links are removed", () => {
  assert.equal(affected.length, 14);
  for (const p of affected) assert.ok(!read(p).includes(missing), p);
});
test("no obsolete profile destination remains in other approved HTML", () => {
  for (const p of listHtmlFiles(goldenHtmlRoot())) assert.ok(!read(p).includes(missing), p);
});
test("GP directory preserves the other nine doctors and valid JSON-LD order", () => {
  const html = read("team-general-practitioners.html");
  const names = [
    "Dr Anand Singh", "Dr Debra Larkins", "Dr Kooshyar Karimi",
    "Dr Nirupa Sivathasan", "Dr Sambo Luon", "Dr Sumita Singh",
    "Dr Tanya Goodwill", "Dr Usman Gul", "Dr Wasantha Hettiarchchi",
  ];
  assert.doesNotMatch(html, /dr-gemunu-ranawake|dr-gemunu-suresh-ranawake|Dr Gemunu Suresh Ranawake/i);
  assert.deepEqual([...html.matchAll(/<h3 class="gp-discovery-name">([^<]+)<\/h3>/g)].map(m => m[1]), names);
  const scripts = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const schemas = scripts.flatMap(m => JSON.parse(m[1])["@graph"] ?? []);
  const list = schemas.find((g: { [key: string]: unknown }) => g["@type"] === "ItemList" && g.name === "General Practitioners")?.itemListElement;
  assert.ok(Array.isArray(list));
  assert.deepEqual(list.map((v: {item:{name:string}}) => v.item.name), names);
  assert.deepEqual(list.map((v: {position:number}) => v.position), names.map((_, i) => i + 1));
});
test("public GP directory mirror matches approved source", () => {
  assert.equal(fs.readFileSync(path.join(webRoot(), "public/team-general-practitioners.html"), "utf8"), read("team-general-practitioners.html"));
});
