-- CreateEnum
CREATE TYPE "GpDoctorProfileStatus" AS ENUM ('draft', 'awaiting_review', 'approved', 'published', 'archived');

-- CreateEnum
CREATE TYPE "GpDoctorProfileSource" AS ENUM ('portal_submission', 'practitioner_import', 'manual_seed');

-- CreateTable
CREATE TABLE "gp_doctor_profile_drafts" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "readiness_package_id" TEXT,
    "practitioner_id" TEXT,
    "enquiry_id" TEXT,
    "status" "GpDoctorProfileStatus" NOT NULL DEFAULT 'draft',
    "source" "GpDoctorProfileSource" NOT NULL DEFAULT 'portal_submission',
    "title" TEXT NOT NULL DEFAULT 'Dr',
    "preferred_published_name" TEXT NOT NULL,
    "credentials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "biography" TEXT NOT NULL DEFAULT '',
    "short_introduction" TEXT NOT NULL DEFAULT '',
    "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "special_interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "years_practising" TEXT,
    "memberships" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "headshot_path" TEXT,
    "headshot_meta_json" JSONB,
    "completeness_score" INTEGER NOT NULL DEFAULT 0,
    "review_notes" TEXT,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gp_doctor_profile_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_doctor_profile_status_audits" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "actor_name" TEXT,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gp_doctor_profile_status_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gp_doctor_profile_drafts_readiness_package_id_key" ON "gp_doctor_profile_drafts"("readiness_package_id");

-- CreateIndex
CREATE INDEX "gp_doctor_profile_drafts_clinic_id_status_updated_at_idx" ON "gp_doctor_profile_drafts"("clinic_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "gp_doctor_profile_drafts_clinic_id_preferred_published_name_idx" ON "gp_doctor_profile_drafts"("clinic_id", "preferred_published_name");

-- CreateIndex
CREATE INDEX "gp_doctor_profile_drafts_practitioner_id_idx" ON "gp_doctor_profile_drafts"("practitioner_id");

-- CreateIndex
CREATE INDEX "gp_doctor_profile_status_audits_profile_id_created_at_idx" ON "gp_doctor_profile_status_audits"("profile_id", "created_at");

-- AddForeignKey
ALTER TABLE "gp_doctor_profile_drafts" ADD CONSTRAINT "gp_doctor_profile_drafts_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_doctor_profile_drafts" ADD CONSTRAINT "gp_doctor_profile_drafts_readiness_package_id_fkey" FOREIGN KEY ("readiness_package_id") REFERENCES "gp_readiness_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_doctor_profile_drafts" ADD CONSTRAINT "gp_doctor_profile_drafts_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_doctor_profile_drafts" ADD CONSTRAINT "gp_doctor_profile_drafts_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "gp_enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_doctor_profile_status_audits" ADD CONSTRAINT "gp_doctor_profile_status_audits_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "gp_doctor_profile_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_doctor_profile_status_audits" ADD CONSTRAINT "gp_doctor_profile_status_audits_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
