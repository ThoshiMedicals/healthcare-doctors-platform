import fs from "node:fs";

const js = fs.readFileSync("old-html/digital-reception.js", "utf8");
const i = js.indexOf("id:'karimi'");
console.log("karimi snippet:\n", js.slice(i, i + 500));
console.log("\nfile starts:\n", js.slice(0, 400));
console.log("\nPRACTITIONERS length region:");
const p = js.indexOf("const PRACTITIONERS");
console.log(js.slice(p, p + 200));
console.log("\nlauncher builders:", (js.match(/digital-reception-launcher/g) || []).length);
console.log("appendChild count", (js.match(/appendChild/g) || []).length);

// Fetch live page and check after noting scripts
const home = await fetch("http://127.0.0.1:3100/").then((r) => r.text());
console.log("\nlive scripts:", [...home.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]));
console.log("live has digital-reception.js", home.includes("digital-reception.js"));

// Try to evaluate early-return condition logic by checking 404 path
const liveJs = await fetch("http://127.0.0.1:3100/digital-reception.js").then((r) => r.text());
console.log("live js len", liveJs.length, "matches disk", liveJs.length === js.replace(/\r\n/g, "\n").length || liveJs === js);
console.log("live js syntax check via Function");
try {
  // strip IIFE invocation edge: wrap as script body is fine for Syntax check via new Function? 
  // Actually (()=>{...})(); as Function body is invalid. Use vm.Script
  const { Script } = await import("node:vm");
  new Script(liveJs);
  console.log("vm Script OK");
} catch (e) {
  console.log("vm Script FAIL", e.message);
}
