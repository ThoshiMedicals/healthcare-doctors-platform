-- CreateEnum
CREATE TYPE "CareerApplicationStatus" AS ENUM ('new', 'reviewing', 'interview', 'offer', 'hired', 'rejected', 'closed');

-- CreateTable
CREATE TABLE "career_applications" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "vacancy_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "role_interest" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "status" "CareerApplicationStatus" NOT NULL DEFAULT 'new',
    "notes" TEXT NOT NULL DEFAULT '',
    "assigned_to_user_id" TEXT,
    "resume_file_name" TEXT,
    "resume_storage_path" TEXT,
    "resume_mime_type" TEXT,
    "resume_size_bytes" INTEGER,
    "privacy_confirmed_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'talent_community',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "career_applications_clinic_id_status_created_at_idx" ON "career_applications"("clinic_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "career_applications_clinic_id_vacancy_id_idx" ON "career_applications"("clinic_id", "vacancy_id");

-- CreateIndex
CREATE INDEX "career_applications_clinic_id_assigned_to_user_id_idx" ON "career_applications"("clinic_id", "assigned_to_user_id");

-- AddForeignKey
ALTER TABLE "career_applications" ADD CONSTRAINT "career_applications_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_applications" ADD CONSTRAINT "career_applications_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_applications" ADD CONSTRAINT "career_applications_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
