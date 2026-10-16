ALTER TABLE "media_assets" ADD COLUMN "uploaded_by" TEXT;
ALTER TABLE "media_assets" ADD COLUMN "approved_at" TIMESTAMP(3);
ALTER TABLE "media_assets" ADD COLUMN "photographer" TEXT;
ALTER TABLE "media_assets" ADD COLUMN "copyright_owner" TEXT;
ALTER TABLE "media_assets" ADD COLUMN "expires_at" TIMESTAMP(3);
