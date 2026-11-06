-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('now_hiring', 'expression_of_interest', 'future_opportunity', 'closed');

-- CreateEnum
CREATE TYPE "VacancyRoleCategory" AS ENUM ('general_practitioner', 'gp_registrar', 'practice_nurse', 'enrolled_nurse', 'reception', 'practice_manager', 'allied_health', 'psychologist', 'dietitian', 'physiotherapist', 'student_placement', 'other');

-- CreateTable
CREATE TABLE "vacancies" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "VacancyStatus" NOT NULL DEFAULT 'expression_of_interest',
    "location" TEXT NOT NULL DEFAULT 'Woolloongabba, Brisbane',
    "employment_type" TEXT NOT NULL DEFAULT '',
    "role_category" "VacancyRoleCategory" NOT NULL,
    "short_summary" TEXT NOT NULL DEFAULT '',
    "full_description" TEXT NOT NULL DEFAULT '',
    "offer_highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vacancies_clinic_id_active_display_order_idx" ON "vacancies"("clinic_id", "active", "display_order");

-- CreateIndex
CREATE INDEX "vacancies_clinic_id_status_idx" ON "vacancies"("clinic_id", "status");

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
