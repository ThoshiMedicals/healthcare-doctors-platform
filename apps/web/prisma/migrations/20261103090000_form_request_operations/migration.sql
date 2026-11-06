-- CreateEnum
CREATE TYPE "FormRequestStatus" AS ENUM ('new', 'assigned', 'in_progress', 'waiting_for_patient', 'completed', 'closed');

-- AlterTable
ALTER TABLE "form_requests"
ADD COLUMN "status" "FormRequestStatus" NOT NULL DEFAULT 'new',
ADD COLUMN "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN "assigned_to_user_id" TEXT,
ADD COLUMN "history" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "form_requests_clinic_id_status_created_at_idx" ON "form_requests"("clinic_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "form_requests_clinic_id_assigned_to_user_id_idx" ON "form_requests"("clinic_id", "assigned_to_user_id");

-- AddForeignKey
ALTER TABLE "form_requests" ADD CONSTRAINT "form_requests_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
