-- AlterTable
ALTER TABLE "vacancies" ADD COLUMN "remuneration_note" TEXT NOT NULL DEFAULT '';
ALTER TABLE "vacancies" ADD COLUMN "apply_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "vacancies" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vacancies" ADD COLUMN "published_at" TIMESTAMP(3);
ALTER TABLE "vacancies" ADD COLUMN "expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "vacancies_clinic_id_active_featured_display_order_idx" ON "vacancies"("clinic_id", "active", "featured", "display_order");
