-- Expand readiness package recruitment ops: statuses, source, notes, tasks, audits, future resume fields.

-- 1) Remap status enum
CREATE TYPE "GpReadinessPackageStatus_new" AS ENUM (
  'new_lead',
  'confidential_discussion',
  'recruitment_review',
  'applicant',
  'onboarding_candidate',
  'provider_number_support',
  'website_profile_preparation',
  'offer_extended',
  'ready_to_start',
  'active_gp',
  'on_hold',
  'not_proceeding'
);

ALTER TABLE "gp_readiness_packages" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "gp_readiness_packages"
  ALTER COLUMN "status" TYPE TEXT USING (
    CASE "status"::text
      WHEN 'plain_lead' THEN 'new_lead'
      WHEN 'recruitment_lead' THEN 'recruitment_review'
      WHEN 'recruitment_applicant' THEN 'applicant'
      WHEN 'onboarding_candidate' THEN 'onboarding_candidate'
      ELSE 'new_lead'
    END
  );

DROP TYPE "GpReadinessPackageStatus";
ALTER TYPE "GpReadinessPackageStatus_new" RENAME TO "GpReadinessPackageStatus";

ALTER TABLE "gp_readiness_packages"
  ALTER COLUMN "status" TYPE "GpReadinessPackageStatus" USING ("status"::"GpReadinessPackageStatus");

ALTER TABLE "gp_readiness_packages" ALTER COLUMN "status" SET DEFAULT 'new_lead';

-- 2) Recruitment source enum + package columns
CREATE TYPE "GpRecruitmentSource" AS ENUM (
  'practice_website',
  'seek',
  'linkedin',
  'indeed',
  'referral',
  'recruitment_agency',
  'existing_gp',
  'google_search',
  'other'
);

CREATE TYPE "GpReadinessPackageTaskStatus" AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

ALTER TABLE "gp_readiness_packages"
  ADD COLUMN "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "recruitment_source" "GpRecruitmentSource",
  ADD COLUMN "resume_token_hash" TEXT,
  ADD COLUMN "resume_token_expires_at" TIMESTAMP(3),
  ADD COLUMN "draft_payload_json" JSONB;

CREATE INDEX "gp_readiness_packages_clinic_id_recruitment_source_idx"
  ON "gp_readiness_packages"("clinic_id", "recruitment_source");

CREATE INDEX "gp_readiness_packages_resume_token_hash_idx"
  ON "gp_readiness_packages"("resume_token_hash");

-- 3) Notes
CREATE TABLE "gp_readiness_package_notes" (
  "id" TEXT NOT NULL,
  "package_id" TEXT NOT NULL,
  "author_user_id" TEXT NOT NULL,
  "author_name" TEXT,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gp_readiness_package_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gp_readiness_package_notes_package_id_created_at_idx"
  ON "gp_readiness_package_notes"("package_id", "created_at");

ALTER TABLE "gp_readiness_package_notes"
  ADD CONSTRAINT "gp_readiness_package_notes_package_id_fkey"
  FOREIGN KEY ("package_id") REFERENCES "gp_readiness_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gp_readiness_package_notes"
  ADD CONSTRAINT "gp_readiness_package_notes_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4) Tasks
CREATE TABLE "gp_readiness_package_tasks" (
  "id" TEXT NOT NULL,
  "package_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "task_key" TEXT,
  "status" "GpReadinessPackageTaskStatus" NOT NULL DEFAULT 'pending',
  "assigned_to_user_id" TEXT,
  "created_by_user_id" TEXT,
  "due_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "gp_readiness_package_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gp_readiness_package_tasks_package_id_status_due_at_idx"
  ON "gp_readiness_package_tasks"("package_id", "status", "due_at");

CREATE INDEX "gp_readiness_package_tasks_assigned_to_user_id_status_idx"
  ON "gp_readiness_package_tasks"("assigned_to_user_id", "status");

ALTER TABLE "gp_readiness_package_tasks"
  ADD CONSTRAINT "gp_readiness_package_tasks_package_id_fkey"
  FOREIGN KEY ("package_id") REFERENCES "gp_readiness_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gp_readiness_package_tasks"
  ADD CONSTRAINT "gp_readiness_package_tasks_assigned_to_user_id_fkey"
  FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "gp_readiness_package_tasks"
  ADD CONSTRAINT "gp_readiness_package_tasks_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5) Status audits
CREATE TABLE "gp_readiness_package_status_audits" (
  "id" TEXT NOT NULL,
  "package_id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "actor_name" TEXT,
  "from_status" TEXT,
  "to_status" TEXT NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gp_readiness_package_status_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gp_readiness_package_status_audits_package_id_created_at_idx"
  ON "gp_readiness_package_status_audits"("package_id", "created_at");

ALTER TABLE "gp_readiness_package_status_audits"
  ADD CONSTRAINT "gp_readiness_package_status_audits_package_id_fkey"
  FOREIGN KEY ("package_id") REFERENCES "gp_readiness_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gp_readiness_package_status_audits"
  ADD CONSTRAINT "gp_readiness_package_status_audits_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
