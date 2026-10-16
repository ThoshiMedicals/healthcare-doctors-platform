-- AlterTable
ALTER TABLE "practitioners" ADD COLUMN "published_payload" JSONB;
ALTER TABLE "services" ADD COLUMN "published_payload" JSONB;
ALTER TABLE "knowledge_articles" ADD COLUMN "published_payload" JSONB;
ALTER TABLE "practice_updates" ADD COLUMN "published_payload" JSONB;
ALTER TABLE "clinic_profiles" ADD COLUMN "published_payload" JSONB;
ALTER TABLE "clinic_profiles" ADD COLUMN "content_status" "PublicationStatus" NOT NULL DEFAULT 'published';
