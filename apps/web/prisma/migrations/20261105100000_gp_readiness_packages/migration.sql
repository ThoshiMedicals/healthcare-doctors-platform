-- CreateEnum
CREATE TYPE "GpReadinessPackageStatus" AS ENUM ('plain_lead', 'recruitment_lead', 'recruitment_applicant', 'onboarding_candidate');

-- CreateTable
CREATE TABLE "gp_readiness_packages" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "status" "GpReadinessPackageStatus" NOT NULL DEFAULT 'recruitment_applicant',
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "preferred_contact_method" TEXT,
    "preferred_start_date" TIMESTAMP(3),
    "payload_json" JSONB NOT NULL,
    "documents_json" JSONB NOT NULL DEFAULT '[]',
    "provider_readiness_json" JSONB,
    "section_19ab_json" JSONB,
    "spousal_assessment_json" JSONB,
    "spousal_outcome" TEXT,
    "provider_number_path" TEXT,
    "source" TEXT NOT NULL DEFAULT 'join_our_team_readiness_portal',
    "enquiry_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gp_readiness_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gp_readiness_packages_enquiry_id_key" ON "gp_readiness_packages"("enquiry_id");

-- CreateIndex
CREATE INDEX "gp_readiness_packages_clinic_id_status_submitted_at_idx" ON "gp_readiness_packages"("clinic_id", "status", "submitted_at");

-- CreateIndex
CREATE INDEX "gp_readiness_packages_clinic_id_email_idx" ON "gp_readiness_packages"("clinic_id", "email");

-- CreateIndex
CREATE INDEX "gp_readiness_packages_email_idx" ON "gp_readiness_packages"("email");

-- AddForeignKey
ALTER TABLE "gp_readiness_packages" ADD CONSTRAINT "gp_readiness_packages_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_readiness_packages" ADD CONSTRAINT "gp_readiness_packages_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "gp_enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
