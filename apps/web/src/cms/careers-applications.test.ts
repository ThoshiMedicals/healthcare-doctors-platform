import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertAllowedResume,
  CAREER_APPLICATION_STATUS_LABEL,
  careerApplicationWhere,
  enhanceTalentCommunityForm,
  isCareerApplicationStatus,
  RESUME_MAX_BYTES,
} from "./careers-applications";

describe("careers applications helpers", () => {
  it("recognises application statuses", () => {
    assert.equal(isCareerApplicationStatus("new"), true);
    assert.equal(isCareerApplicationStatus("interview"), true);
    assert.equal(isCareerApplicationStatus("bogus"), false);
    assert.equal(CAREER_APPLICATION_STATUS_LABEL.offer, "Offer");
  });

  it("builds list filters for search, status, vacancy, and dates", () => {
    const where = careerApplicationWhere("clinic-1", {
      q: "Nurse",
      status: "reviewing",
      vacancyId: "vac-1",
      from: "2026-11-01",
      to: "2026-11-30",
    });
    assert.equal(where.clinicId, "clinic-1");
    assert.equal(where.status, "reviewing");
    assert.equal(where.vacancyId, "vac-1");
    assert.ok(where.createdAt);
    assert.ok(where.OR);
  });

  it("filters talent-community-only applications", () => {
    const where = careerApplicationWhere("clinic-1", { vacancyId: "none" });
    assert.equal(where.vacancyId, null);
  });

  it("validates resume type and size", () => {
    assert.equal(assertAllowedResume({ name: "cv.pdf", type: "application/pdf", size: 1024 }), ".pdf");
    assert.throws(() => assertAllowedResume({ name: "cv.exe", type: "application/octet-stream", size: 10 }), /PDF or Word/);
    assert.throws(
      () => assertAllowedResume({ name: "cv.pdf", type: "application/pdf", size: RESUME_MAX_BYTES + 1 }),
      /5 MB/,
    );
  });

  it("enhances the talent community form for secure submit", () => {
    const html = `<form class="patient-form-request" data-talent-community-form="" novalidate="">
<p class="form-email-handoff">mailto handoff</p>
<span class="careers-file-hint">email attach</span>
<label class="form-consent" for="x"><input id="x" name="privacy_confirm" type="checkbox"/> <span>old consent</span></label>
</form>`;
    const next = enhanceTalentCommunityForm(html, "woolloongabba");
    assert.match(next, /data-clinic-slug="woolloongabba"/);
    assert.match(next, /enctype="multipart\/form-data"/);
    assert.match(next, /action="\/api\/clinics\/woolloongabba\/career-applications"/);
    assert.match(next, /data-talent-vacancy-field/);
    assert.match(next, /stored securely for the practice recruitment team/);
    assert.match(next, /up to 5/);
    assert.match(next, /consent to the practice storing my details/);
  });
});
