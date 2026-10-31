import fs from "node:fs";
import { createHash } from "node:crypto";

const c = fs.readFileSync("old-html/digital-reception.js", "utf8");
const L = c.indexOf("launcher=document.createElement");
const before = c.slice(0, L);

console.log("hash", createHash("sha256").update(c).digest("hex").slice(0, 16));
console.log("len", c.length);
console.log("launcher at", L);

// Find measure usage before launcher
console.log("measure( before launcher", (before.match(/measure\(/g) || []).length);
console.log("first measure(", c.indexOf("measure("));

// Look for Identifier references that might not exist at parse/run time
// Extract a small AST-less check: run in jsdom-less vm with stubs
import vm from "node:vm";

const html = `<!doctype html><html><body class="home-page has-persistent-care-actions">
<nav class="persistent-care-actions"><div class="persistent-care-actions-inner">
<a class="persistent-care-book">Book</a><a class="persistent-care-call">Call</a>
</div></nav>
<script src="digital-reception.js"></script>
</body></html>`;

// Minimal DOM stub
function makeDom() {
  const bodyChildren = [];
  const body = {
    classList: {
      _s: new Set(["home-page", "has-persistent-care-actions"]),
      add(x) { this._s.add(x); },
      remove(x) { this._s.delete(x); },
      contains(x) { return this._s.has(x); },
    },
    children: bodyChildren,
    append(...nodes) { bodyChildren.push(...nodes); },
    querySelector(sel) {
      if (sel === ".persistent-care-actions") return dock;
      if (sel === ".persistent-care-actions-inner") return dockInner;
      if (sel === ".digital-reception-launcher") return bodyChildren.find((n) => n.className?.includes?.("digital-reception-launcher")) || dockInner.children.find((n) => n.className?.includes?.("digital-reception-launcher")) || null;
      return null;
    },
  };
  const dockInner = {
    children: [],
    append(node) { this.children.push(node); },
  };
  const dock = {
    className: "persistent-care-actions",
    setAttribute() {},
    getBoundingClientRect: () => ({ height: 56 }),
    querySelector: (sel) => (sel === ".persistent-care-actions-inner" ? dockInner : null),
  };
  const created = [];
  const document = {
    body,
    head: { appendChild() {} },
    documentElement: { style: { setProperty() {} } },
    currentScript: { src: "http://127.0.0.1:3100/digital-reception.js" },
    scripts: [{ src: "http://127.0.0.1:3100/digital-reception.js" }],
    querySelector(sel) {
      if (sel === ".digital-reception-launcher") return body.querySelector(sel);
      if (sel === ".persistent-care-actions") return dock;
      if (sel === ".persistent-care-actions-inner") return dockInner;
      return null;
    },
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        className: "",
        type: "",
        innerHTML: "",
        style: {},
        children: [],
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = v; },
        getAttribute(k) { return this.attributes[k]; },
        addEventListener() {},
        append(...n) { this.children.push(...n); },
        querySelector(sel) {
          if (sel.startsWith(".")) {
            const cls = sel.slice(1).split(".")[0];
            const walk = (node) => {
              if (String(node.className || "").split(/\s+/).includes(cls)) return node;
              for (const ch of node.children || []) {
                const hit = walk(ch);
                if (hit) return hit;
              }
              return null;
            };
            return walk(el);
          }
          return null;
        },
        querySelectorAll() { return []; },
        classList: {
          add(x) { el.className = (el.className + " " + x).trim(); },
          contains(x) { return el.className.split(/\s+/).includes(x); },
        },
      };
      created.push(el);
      return el;
    },
  };
  const windowObj = {
    document,
    location: { pathname: "/", href: "http://127.0.0.1:3100/" },
    innerWidth: 1280,
    addEventListener() {},
    ResizeObserver: class { observe() {} },
    WMCNavigation: { closeCompact() {} },
    WMCBookingArchitecture: { sync() {} },
  };
  windowObj.window = windowObj;
  return { document, windowObj, dockInner, created };
}

const { document, windowObj, dockInner } = makeDom();
const sandbox = {
  window: windowObj,
  document,
  location: windowObj.location,
  console,
  setTimeout,
  clearTimeout,
  fetch: async () => ({ ok: false }),
  URL,
  Promise,
  Array,
  Object,
  String,
  Math,
  JSON,
  Error,
  Map,
  Set,
  ResizeObserver: windowObj.ResizeObserver,
};
sandbox.globalThis = sandbox;

try {
  vm.runInNewContext(c, sandbox, { timeout: 5000 });
  console.log("vm run OK");
  console.log("dock kids", dockInner.children.map((x) => x.className));
  console.log("WMCDigitalReception", typeof sandbox.window.WMCDigitalReception);
} catch (e) {
  console.log("vm FAIL", e.message);
  console.log(e.stack?.split("\n").slice(0, 12).join("\n"));
}
