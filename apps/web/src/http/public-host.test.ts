import assert from "node:assert/strict";
import test from "node:test";
import {
  PRODUCTION_APEX_HOST,
  publicHostRedirectUrl,
  requestArrivedOverHttps,
} from "./public-host";

test("HTTPS detection trusts x-forwarded-proto from the edge", () => {
  assert.equal(requestArrivedOverHttps("http:", "https"), true);
  assert.equal(requestArrivedOverHttps("http:", "http"), false);
  assert.equal(requestArrivedOverHttps("https:", null), true);
});

test("local UAT hosts never force an HTTPS redirect", () => {
  assert.equal(
    publicHostRedirectUrl({
      hostHeader: "127.0.0.1:3100",
      protocol: "http:",
      forwardedProto: "http",
      pathname: "/",
      search: "",
    }),
    null,
  );
  assert.equal(
    publicHostRedirectUrl({
      hostHeader: "localhost:3100",
      protocol: "http:",
      forwardedProto: "http",
      pathname: "/join-our-team.html",
      search: "?x=1",
    }),
    null,
  );
});

test("public HTTP requests permanently redirect to HTTPS", () => {
  const url = publicHostRedirectUrl({
    hostHeader: "next.gabbamedicalcentre.com.au",
    protocol: "http:",
    forwardedProto: "http",
    pathname: "/join-our-team.html",
    search: "?ref=seo",
  });
  assert.ok(url);
  assert.equal(url.href, "https://next.gabbamedicalcentre.com.au/join-our-team.html?ref=seo");
});

test("www production host permanently redirects to the HTTPS apex", () => {
  const fromHttp = publicHostRedirectUrl({
    hostHeader: "www.gabbamedicalcentre.com.au",
    protocol: "http:",
    forwardedProto: "http",
    pathname: "/team.html",
    search: "",
  });
  assert.ok(fromHttp);
  assert.equal(fromHttp.href, `https://${PRODUCTION_APEX_HOST}/team.html`);

  const fromHttps = publicHostRedirectUrl({
    hostHeader: "www.gabbamedicalcentre.com.au",
    protocol: "https:",
    forwardedProto: "https",
    pathname: "/services.html",
    search: "?utm=1",
  });
  assert.ok(fromHttps);
  assert.equal(fromHttps.href, `https://${PRODUCTION_APEX_HOST}/services.html?utm=1`);
});

test("already-correct HTTPS apex requests pass through", () => {
  assert.equal(
    publicHostRedirectUrl({
      hostHeader: PRODUCTION_APEX_HOST,
      protocol: "https:",
      forwardedProto: "https",
      pathname: "/",
      search: "",
    }),
    null,
  );
});
