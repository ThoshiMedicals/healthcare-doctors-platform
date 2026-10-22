import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { isQuickTunnelHost, prefersSecureCookie } from "./host";

const previous = process.env.UAT_QUICK_TUNNEL;

afterEach(() => {
  if (previous === undefined) delete process.env.UAT_QUICK_TUNNEL;
  else process.env.UAT_QUICK_TUNNEL = previous;
});

describe("quick tunnel host", () => {
  it("accepts a trycloudflare hostname only while UAT is on", () => {
    delete process.env.UAT_QUICK_TUNNEL;
    assert.equal(isQuickTunnelHost("random-words.trycloudflare.com"), false);
    process.env.UAT_QUICK_TUNNEL = "true";
    assert.equal(isQuickTunnelHost("random-words.trycloudflare.com"), true);
    assert.equal(isQuickTunnelHost("Random-Words.trycloudflare.com:443"), true);
  });

  it("rejects other hosts while UAT is on", () => {
    process.env.UAT_QUICK_TUNNEL = "true";
    assert.equal(isQuickTunnelHost("trycloudflare.com"), false);
    assert.equal(isQuickTunnelHost("gabbamedicalcentre.com.au"), false);
    assert.equal(isQuickTunnelHost("random-words.trycloudflare.com.evil.com"), false);
    assert.equal(isQuickTunnelHost("localhost"), false);
  });
});

describe("secure cookie behind a tunnel", () => {
  it("treats forwarded https as secure when the local socket is http", () => {
    assert.equal(prefersSecureCookie("http:", "https"), true);
    assert.equal(prefersSecureCookie("https:", null), true);
    assert.equal(prefersSecureCookie("http:", null), false);
    assert.equal(prefersSecureCookie("http:", "http"), false);
  });
});
