CREATE TYPE "ReviewStatus_new" AS ENUM ('draft', 'under_review', 'approved', 'published', 'review_due');

ALTER TABLE "practice_updates" ALTER COLUMN "review_status" DROP DEFAULT;
ALTER TABLE "clinical_reviews" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "practice_updates"
  ALTER COLUMN "review_status" TYPE "ReviewStatus_new"
  USING (
    CASE "review_status"::text
      WHEN 'awaiting_review' THEN 'draft'
      WHEN 'in_review' THEN 'under_review'
      WHEN 'approved' THEN 'approved'
      WHEN 'review_due' THEN 'review_due'
      WHEN 'superseded' THEN 'review_due'
      ELSE 'draft'
    END
  )::"ReviewStatus_new";

ALTER TABLE "clinical_reviews"
  ALTER COLUMN "status" TYPE "ReviewStatus_new"
  USING (
    CASE "status"::text
      WHEN 'awaiting_review' THEN 'draft'
      WHEN 'in_review' THEN 'under_review'
      WHEN 'approved' THEN 'approved'
      WHEN 'review_due' THEN 'review_due'
      WHEN 'superseded' THEN 'review_due'
      ELSE 'draft'
    END
  )::"ReviewStatus_new";

DROP TYPE "ReviewStatus";
ALTER TYPE "ReviewStatus_new" RENAME TO "ReviewStatus";

ALTER TABLE "practice_updates" ALTER COLUMN "review_status" SET DEFAULT 'draft';
ALTER TABLE "clinical_reviews" ALTER COLUMN "status" SET DEFAULT 'draft';

UPDATE "clinical_reviews"
SET "status" = 'under_review'
WHERE "status" IN ('approved', 'published')
  AND (
    "reviewed_by" IS NULL OR btrim("reviewed_by") = ''
    OR "approved_by" IS NULL OR btrim("approved_by") = ''
    OR "approved_at" IS NULL
    OR "evidence_reference" IS NULL OR btrim("evidence_reference") = ''
    OR "reviewed_content_sha256" IS NULL OR btrim("reviewed_content_sha256") = ''
  );

CREATE TABLE "login_throttles" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_failed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_throttles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "login_throttles_subject_key" ON "login_throttles"("subject");
