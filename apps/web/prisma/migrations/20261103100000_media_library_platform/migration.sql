-- AlterTable
ALTER TABLE "media_assets"
ADD COLUMN "category" TEXT,
ADD COLUMN "title" TEXT,
ADD COLUMN "byte_size" INTEGER,
ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER,
ADD COLUMN "last_used_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "media_assets_clinic_id_category_idx" ON "media_assets"("clinic_id", "category");
