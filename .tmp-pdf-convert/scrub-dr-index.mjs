import fs from "node:fs";

const paths = [
  "old-html/digital-reception-index.js",
  "apps/web/public/digital-reception-index.js",
];

const COSMETIC =
  /cosmetic|anti-wrinkle|injectable|platelet-rich|society of cosmetic/i;
const RANAWARE = /ranawake|gemunu/i;

function scrubEntry(entry) {
  if (!entry || typeof entry !== "object") return entry;
  const blob = JSON.stringify(entry);
  if (RANAWARE.test(blob)) return null;
  const next = { ...entry };
  for (const key of Object.keys(next)) {
    const val = next[key];
    if (typeof val === "string") {
      let s = val;
      s = s.replace(/Skin\s+and\s+cosmetic\s+medicine/gi, "Skin medicine");
      s = s.replace(/Skin\s*&\s*cosmetic\s+medicine/gi, "Skin medicine");
      s = s.replace(/,\s*and\s+the\s+Australian\s+Society\s+of\s+Cosmetic\s+Medicine/gi, "");
      s = s.replace(/Australian\s+Society\s+of\s+Cosmetic\s+Medicine/gi, "");
      for (const phrase of [
        "Cosmetic and procedural medicine",
        "Cosmetic procedures",
        "Cosmetic injectables",
        "Cosmetic medicine",
        "Anti-wrinkle injectables",
        "Platelet-rich plasma injections",
      ]) {
        const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        s = s.replace(new RegExp(`,\\s*and\\s+${esc}`, "gi"), "");
        s = s.replace(new RegExp(`\\band\\s+${esc}`, "gi"), "");
        s = s.replace(new RegExp(`,\\s*${esc}`, "gi"), "");
        s = s.replace(new RegExp(esc, "gi"), "");
      }
      s = s.replace(/,\s*,+/g, ",").replace(/\s{2,}/g, " ").trim();
      next[key] = s;
    } else if (Array.isArray(val)) {
      next[key] = val
        .map((item) => (typeof item === "string" ? item : item))
        .filter((item) => !(typeof item === "string" && (COSMETIC.test(item) || RANAWARE.test(item))))
        .map((item) => {
          if (typeof item !== "string") return item;
          return item.replace(/Skin\s+and\s+cosmetic\s+medicine/gi, "Skin medicine");
        });
    }
  }
  return next;
}

for (const file of paths) {
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^(window\.WMC_DIGITAL_RECEPTION_INDEX\s*=\s*)([\s\S]*?)(;\s*)$/);
  if (!m) {
    console.log("skip structure", file);
    continue;
  }
  const data = JSON.parse(m[2]);
  const before = data.length;
  const scrubbed = data.map(scrubEntry).filter(Boolean);
  const out = `${m[1]}${JSON.stringify(scrubbed)}${m[3] || ";\n"}`;
  fs.writeFileSync(file, out.endsWith("\n") ? out : out + "\n");
  const still = /ranawake|gemunu|cosmetic|anti-wrinkle/i.test(out);
  console.log(file, before, "->", scrubbed.length, "still?", still);
}
