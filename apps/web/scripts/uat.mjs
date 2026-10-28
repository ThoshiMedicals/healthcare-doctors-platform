import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2];
if (mode !== "build" && mode !== "start") {
  console.error("Usage: node scripts/uat.mjs <build|start>");
  process.exit(1);
}

const env = { ...process.env, UAT_QUICK_TUNNEL: "true" };
delete env.AUTH_URL;

if (mode === "build") {
  const engine = path.join(root, "node_modules", ".prisma", "client", "query_engine-windows.dll.node");
  if (!existsSync(engine)) {
    const prismaBin = path.join(root, "node_modules", "prisma", "build", "index.js");
    const generated = spawnSync(process.execPath, [prismaBin, "generate"], {
      cwd: root,
      env,
      stdio: "inherit",
    });
    if (generated.status !== 0) process.exit(generated.status ?? 1);
  }
}

if (mode === "build") {
  const optimized = spawnSync(process.execPath, [path.join(root, "scripts", "optimize-css.mjs")], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (optimized.status !== 0) process.exit(optimized.status ?? 1);
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const args = mode === "build" ? ["build"] : ["start", "-p", "3100"];
const child = spawn(process.execPath, [nextBin, ...args], {
  cwd: root,
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (mode === "build" && code === 0) removeUatTypeInclude();
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

function removeUatTypeInclude() {
  const file = path.join(root, "tsconfig.json");
  const source = readFileSync(file, "utf8");
  const next = source.replace(/\r?\n\s*"\.next-uat\/types\/\*\*\/\*\.ts",?/, "");
  if (next !== source) writeFileSync(file, next);
}
