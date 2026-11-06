-- GP Attraction Asset Library expansion: taxonomy fields, quotes, consent, review events, story linkage.

ALTER TYPE "AttractionAssetKind" ADD VALUE IF NOT EXISTS 'quote';

CREATE TYPE "AttractionAssetReviewDecision" AS ENUM (
  'submit_for_review',
  'request_changes',
  'approve',
  'publish',
  'mark_review_due',
  'retire',
  'withdraw',
  'purge',
  'replace_placeholder'
);

CREATE TYPE "AttractionAssetRightsClass" AS ENUM (
  'no_people',
  'consented_staff',
  'consented_gp_named',
  'role_label_only',
  'composite_labelled',
  'ai_placeholder'
);

CREATE TABLE "attraction_asset_consents" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "consent_version" TEXT NOT NULL,
    "subject_display_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "channels_allowed_json" JSONB NOT NULL DEFAULT '[]',
    "channels_denied_json" JSONB NOT NULL DEFAULT '[]',
    "document_uri" TEXT,
    "signed_at" TIMESTAMP(3),
    "signed_by_name" TEXT,
    "withdrawn_at" TIMESTAMP(3),
    "withdrawal_reason" TEXT,
    "retention_until" TIMESTAMP(3),
    "related_story_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attraction_asset_consents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attraction_asset_review_events" (
    "id" TEXT NOT NULL,
    "asset_row_id" TEXT NOT NULL,
    "from_status" "AttractionAssetStatus" NOT NULL,
    "to_status" "AttractionAssetStatus" NOT NULL,
    "decision" "AttractionAssetReviewDecision" NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "checklist_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attraction_asset_review_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "replaceable_path" TEXT;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "placeholder_kind" TEXT;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "width" INTEGER;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "height" INTEGER;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "duration_sec" INTEGER;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "byte_size" INTEGER;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "quote_text" TEXT;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "derivatives_json" JSONB;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "scene" TEXT;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "module_hints" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "persona_hints" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "rights_class" "AttractionAssetRightsClass" NOT NULL DEFAULT 'ai_placeholder';
ALTER TABLE "attraction_assets" ALTER COLUMN "ai_policy" SET DEFAULT 'ai_ok';
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "clinic_scope" TEXT NOT NULL DEFAULT 'flagship_only';
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "channels_allowed_json" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "channels_denied_json" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "related_document_kind" TEXT;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "transcript_of_asset_id" TEXT;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "parent_asset_id" TEXT;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "related_story_id" TEXT;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "consent_record_id" TEXT;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "review_cadence_days" INTEGER NOT NULL DEFAULT 730;
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "withdrawn_at" TIMESTAMP(3);
ALTER TABLE "attraction_assets" ADD COLUMN IF NOT EXISTS "owner_user_id" TEXT;

CREATE INDEX IF NOT EXISTS "attraction_assets_related_story_id_idx" ON "attraction_assets"("related_story_id");
CREATE INDEX IF NOT EXISTS "attraction_assets_next_review_at_idx" ON "attraction_assets"("next_review_at");
CREATE INDEX "attraction_asset_consents_clinic_id_status_idx" ON "attraction_asset_consents"("clinic_id", "status");
CREATE INDEX "attraction_asset_consents_related_story_id_idx" ON "attraction_asset_consents"("related_story_id");
CREATE INDEX "attraction_asset_review_events_asset_row_id_created_at_idx" ON "attraction_asset_review_events"("asset_row_id", "created_at");
CREATE INDEX "attraction_asset_review_events_decision_idx" ON "attraction_asset_review_events"("decision");

ALTER TABLE "attraction_assets" ADD CONSTRAINT "attraction_assets_related_story_id_fkey" FOREIGN KEY ("related_story_id") REFERENCES "gp_stories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attraction_assets" ADD CONSTRAINT "attraction_assets_consent_record_id_fkey" FOREIGN KEY ("consent_record_id") REFERENCES "attraction_asset_consents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attraction_asset_review_events" ADD CONSTRAINT "attraction_asset_review_events_asset_row_id_fkey" FOREIGN KEY ("asset_row_id") REFERENCES "attraction_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attraction_asset_review_events" ADD CONSTRAINT "attraction_asset_review_events_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
