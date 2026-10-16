-- AlterEnum
ALTER TYPE "MembershipRole" ADD VALUE 'super_admin';
ALTER TYPE "MembershipRole" ADD VALUE 'content_editor';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AlterTable
ALTER TABLE "clinic_profiles" ADD COLUMN "billing_policy" TEXT;
ALTER TABLE "clinic_profiles" ADD COLUMN "agpal_status" TEXT;

-- CreateTable
CREATE TABLE "content_revisions" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "author_id" TEXT,
    "previous" JSONB NOT NULL,
    "next" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_revisions_clinic_id_entity_type_entity_id_created_at_idx" ON "content_revisions"("clinic_id", "entity_type", "entity_id", "created_at");

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
