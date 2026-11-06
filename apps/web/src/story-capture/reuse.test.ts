import assert from "node:assert/strict";
import test from "node:test";
import {
  ALL_REUSE_CHANNELS,
  CHANNEL_SURFACE,
  HARD_BLOCK_CHANNELS,
  isHardBlockedChannel,
} from "./channels";

test("default placable channels cover PE, Opportunities, and Opportunity Pack", () => {
  assert.ok(ALL_REUSE_CHANNELS.includes("practice_experience_web"));
  assert.ok(ALL_REUSE_CHANNELS.includes("gp_opportunities_rail"));
  assert.ok(ALL_REUSE_CHANNELS.includes("internal_proposal_pack"));
  assert.equal(
    CHANNEL_SURFACE.practice_experience_web.surfacePath,
    "about-us/practice-experience.html",
  );
  assert.equal(
    CHANNEL_SURFACE.gp_opportunities_rail.surfacePath,
    "join-our-team.html#gp-opportunities",
  );
  assert.equal(CHANNEL_SURFACE.internal_proposal_pack.moduleKey, "opportunity-pack");
});

test("hard-blocked third-party channels are never placable enums", () => {
  for (const ch of HARD_BLOCK_CHANNELS) {
    assert.equal(isHardBlockedChannel(ch), true);
    assert.equal((ALL_REUSE_CHANNELS as readonly string[]).includes(ch), false);
  }
});
