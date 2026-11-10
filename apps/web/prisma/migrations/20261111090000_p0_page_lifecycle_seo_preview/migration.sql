-- P0 Full Admin CMS foundation: page SEO draft, preview tokens, multi-instance cache epoch.

ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "public_cache_epoch" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "seo_draft" JSONB;

CREATE TABLE IF NOT EXISTS "draft_preview_tokens" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "page_id" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "token_hash" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_preview_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "draft_preview_tokens_token_hash_key" ON "draft_preview_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "draft_preview_tokens_clinic_id_expires_at_idx" ON "draft_preview_tokens"("clinic_id", "expires_at");

DO $$ BEGIN
  ALTER TABLE "draft_preview_tokens" ADD CONSTRAINT "draft_preview_tokens_clinic_id_fkey"
    FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "draft_preview_tokens" ADD CONSTRAINT "draft_preview_tokens_page_id_fkey"
    FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "draft_preview_tokens" ADD CONSTRAINT "draft_preview_tokens_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
