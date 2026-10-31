import fs from "node:fs";
const code = fs.readFileSync("old-html/digital-reception.js", "utf8");
const body = code.replace(/^\(\(\) => \{/, "").replace(/\}\)\(\);?\s*$/, "");

// Find brace depth at key markers
const markers = [
  "const PRACTITIONERS=",
  "launcher=document.createElement('button')",
  "document.body.append(launcher,panel)",
  "window.WMCDigitalReception=",
];
for (const marker of markers) {
  const at = body.indexOf(marker);
  let depth = 0;
  for (let i = 0; i < at; i++) {
    const ch = body[i];
    // naive: ignore strings roughly
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  console.log(marker.slice(0, 40), "at", at, "depth", depth);
}

// Better string-aware depth scan around launcher
function depthAt(pos) {
  let depth = 0;
  let mode = "code"; // code | squote | dquote | template | linecomment | blockcomment
  for (let i = 0; i < pos; i++) {
    const ch = body[i];
    const next = body[i + 1];
    if (mode === "code") {
      if (ch === "'" ) mode = "squote";
      else if (ch === '"') mode = "dquote";
      else if (ch === "`") mode = "template";
      else if (ch === "/" && next === "/") { mode = "linecomment"; i++; }
      else if (ch === "/" && next === "*") { mode = "blockcomment"; i++; }
      else if (ch === "{") depth++;
      else if (ch === "}") depth--;
    } else if (mode === "squote") {
      if (ch === "\\\\") i++;
      else if (ch === "'") mode = "code";
    } else if (mode === "dquote") {
      if (ch === "\\\\") i++;
      else if (ch === '"') mode = "code";
    } else if (mode === "template") {
      if (ch === "\\\\") i++;
      else if (ch === "`") mode = "code";
    } else if (mode === "linecomment") {
      if (ch === "\\n") mode = "code";
    } else if (mode === "blockcomment") {
      if (ch === "*" && next === "/") { mode = "code"; i++; }
    }
  }
  return depth;
}

for (const marker of markers) {
  const at = body.indexOf(marker);
  console.log("aware", marker.slice(0, 40), "depth", depthAt(at));
}

// Show 400 chars BEFORE launcher create for surrounding context
const L = body.indexOf("launcher=document.createElement('button')");
console.log("\nCONTEXT BEFORE LAUNCHER:\n", body.slice(L - 500, L).replace(/\s+/g, " "));
