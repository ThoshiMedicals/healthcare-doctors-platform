import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDoctorProfileExport,
  normalizeWebsiteProfile,
  scoreDoctorProfileCompleteness,
} from "./doctor-profile";

describe("scoreDoctorProfileCompleteness", () => {
  it("scores an empty profile low with missing checklist items", () => {
    const result = scoreDoctorProfileCompleteness({});
    assert.equal(result.score, 0);
    assert.ok(result.missing.includes("biography"));
    assert.ok(result.missing.includes("photo"));
  });

  it("scores a complete profile at 100", () => {
    const result = scoreDoctorProfileCompleteness({
      biography: Array.from({ length: 90 }, () => "word").join(" "),
      shortIntroduction: "A".repeat(50),
      preferredPublishedName: "Dr Example",
      qualifications: ["FRACGP", "MBBS"],
      specialInterests: ["Family Medicine"],
      languages: ["English"],
      memberships: ["RACGP"],
      headshotPath: "clinic/pkg/headshot.jpg",
    });
    assert.equal(result.score, 100);
    assert.deepEqual(result.missing, []);
  });
});

describe("normalizeWebsiteProfile", () => {
  it("normalizes string lists and caps short intro", () => {
    const normalized = normalizeWebsiteProfile(
      {
        title: "Dr",
        preferredPublishedName: "Dr Example",
        qualifications: "MBBS, FRACGP",
        languagesSpoken: "English; Persian",
        shortIntroduction: "x".repeat(300),
        biography: "Bio text",
      },
      "Dr Fallback",
    );
    assert.deepEqual(normalized.qualifications, ["MBBS", "FRACGP"]);
    assert.deepEqual(normalized.languages, ["English", "Persian"]);
    assert.equal(normalized.shortIntroduction.length, 250);
  });
});

describe("buildDoctorProfileExport", () => {
  const profile = {
    preferredPublishedName: "Dr Example",
    title: "Dr",
    credentials: ["FRACGP"],
    qualifications: ["MBBS", "FRACGP"],
    shortIntroduction: "Short intro",
    biography: "Long biography text",
    specialInterests: ["Family Medicine"],
    languages: ["English"],
    memberships: ["RACGP"],
    yearsPractising: "10",
    headshotPath: null,
    completenessScore: 80,
    status: "awaiting_review",
  } as const;

  it("builds website, booking, and announcement packages", () => {
    const website = buildDoctorProfileExport(profile as never, "website");
    const booking = buildDoctorProfileExport(profile as never, "booking");
    const announcement = buildDoctorProfileExport(profile as never, "announcement");
    assert.match(website.markdown, /Website Profile Package/);
    assert.equal(booking.json.kind, "booking_profile_package");
    assert.equal(announcement.json.kind, "new_doctor_announcement_package");
  });
});
