import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { applyAccessibilityClosure } from "./accessibility";
import { applyPublicUxRefinements } from "./public-ux";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../old-html");

function resolveNavHref(fromPage: string, href: string): string | null {
  if (!href || href.startsWith("#") || href.startsWith("tel:") || href.startsWith("mailto:")) return null;
  if (/^https?:\/\//i.test(href)) return null;
  const clean = href.split("#")[0].split("?")[0];
  if (!clean) return null;
  const fromDir = path.posix.dirname(fromPage.replace(/\\/g, "/"));
  const joined = path.posix.normalize(fromDir === "." ? clean : path.posix.join(fromDir, clean));
  return joined.replace(/^\.\//, "");
}

test("UX-005: homepage primary nav links resolve to existing golden HTML targets", () => {
  const raw = readFileSync(path.join(root, "index.html"), "utf8");
  const html = applyPublicUxRefinements(applyAccessibilityClosure(raw, "index.html"), "index.html");
  const nav = html.match(/<nav\b[^>]*\bid="primary-nav"[^>]*>[\s\S]*?<\/nav>/i)?.[0];
  assert.ok(nav, "primary-nav present");
  assert.match(nav!, /data-nav-key="join-team"/);
  assert.match(nav!, />Join Our Team</);

  const hrefs = [...nav!.matchAll(/\bhref="([^"]+)"/gi)].map((m) => m[1]);
  assert.ok(hrefs.length >= 5, `expected several nav hrefs, got ${hrefs.length}`);

  const missing: string[] = [];
  for (const href of hrefs) {
    const resolved = resolveNavHref("index.html", href);
    if (!resolved) continue;
    const disk = path.join(root, resolved);
    if (!existsSync(disk)) missing.push(`${href} → ${resolved}`);
  }
  assert.equal(missing.length, 0, missing.join("\n"));
});

test("UX-005: menu toggle exposes controls for keyboard expansion", () => {
  const raw = readFileSync(path.join(root, "index.html"), "utf8");
  const html = applyPublicUxRefinements(applyAccessibilityClosure(raw, "index.html"), "index.html");
  const toggle = html.match(/<button\b[^>]*\bmenu-toggle\b[^>]*>/i)?.[0] || "";
  assert.ok(toggle, "menu-toggle button present");
  assert.match(toggle, /\baria-controls="primary-nav"/);
  assert.match(toggle, /\baria-expanded="false"/);
  assert.match(html, /\bid="primary-nav"/);
});

test("UX-005: nested doctor page Contact/Join relative nav stays consistent", () => {
  const raw = readFileSync(path.join(root, "doctors/dr-mary-abadir.html"), "utf8");
  const html = applyPublicUxRefinements(applyAccessibilityClosure(raw, "doctors/dr-mary-abadir.html"), "doctors/dr-mary-abadir.html");
  const nav = html.match(/<nav\b[^>]*\bid="primary-nav"[^>]*>[\s\S]*?<\/nav>/i)?.[0] || "";
  const join = nav.match(/<a\b[^>]*data-nav-key="join-team"[^>]*>/i)?.[0] || "";
  const contact = nav.match(/<a\b[^>]*data-nav-key="contact"[^>]*>/i)?.[0] || "";
  assert.match(join, /href="[^"]*join-our-team\.html"/i);
  assert.match(contact, /href="[^"]*contact\.html"/i);
  const joinHref = join.match(/\bhref="([^"]+)"/i)?.[1] || "";
  const contactHref = contact.match(/\bhref="([^"]+)"/i)?.[1] || "";
  assert.ok(joinHref.includes("../") || joinHref.startsWith("join-our-team"), joinHref);
  assert.ok(contactHref.includes("../") || contactHref.startsWith("contact"), contactHref);
});
