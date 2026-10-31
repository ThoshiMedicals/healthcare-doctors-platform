import fs from "node:fs";

const code = fs.readFileSync("old-html/digital-reception.js", "utf8");
const m = code.match(/^\(\(\) => \{([\s\S]*)\}\)\(\);?\s*$/);
if (!m) {
  console.log("IIFE parse fail", code.slice(0, 60), code.slice(-60));
  process.exit(1);
}
const body = m[1];
// Find mount / launcher creation points
for (const needle of [
  "digital-reception-launcher",
  "createElement",
  "appendChild",
  "DOMContentLoaded",
  "document.readyState",
  "return;",
  "WMC_DIGITAL",
  "indexPromise",
  "fetch(",
]) {
  let idx = 0;
  let n = 0;
  console.log("\n==", needle, "==");
  while ((idx = body.indexOf(needle, idx)) !== -1 && n < 6) {
    console.log(body.slice(Math.max(0, idx - 80), idx + needle.length + 120).replace(/\s+/g, " "));
    idx += needle.length;
    n++;
  }
}

// Check if scrub left broken object literals nearby practitioners
const pract = body.match(/const PRACTITIONERS=\[[\s\S]*?\];/);
if (pract) {
  try {
    // eslint-disable-next-line no-new-func
    new Function(`const PRACTITIONER_HOTDOC='x'; const PRACTITIONERS=${pract[0].replace(/^const PRACTITIONERS=/, "")}; return PRACTITIONERS.length;`);
    const len = new Function(
      `const PRACTITIONER_HOTDOC='x'; ${pract[0]}; return PRACTITIONERS.length;`,
    )();
    console.log("\nPRACTITIONERS ok len", len);
  } catch (e) {
    console.log("\nPRACTITIONERS FAIL", e.message);
  }
}
