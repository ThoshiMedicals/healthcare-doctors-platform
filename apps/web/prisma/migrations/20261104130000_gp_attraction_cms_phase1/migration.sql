-- GP Attraction CMS Phase 1: documents, immutable revisions, human approvals, schema validations, asset registry.
-- Production publish remains blocked in application services.

CREATE TYPE "AttractionDocumentKind" AS ENUM ('opportunities', 'faq', 'practice_experience', 'registrar_pathway', 'story');
CREATE TYPE "AttractionPublishState" AS ENUM ('drafting', 'in_review', 'approved', 'scheduled', 'published', 'review_due', 'on_hold', 'archived');
CREATE TYPE "AttractionChangeClass" AS ENUM ('A_minor', 'B_substantive_copy', 'C_clinical_or_capacity', 'D_schema_or_vacancy');
CREATE TYPE "AttractionApprovalDecision" AS ENUM ('submit_for_review', 'request_changes', 'approve', 'pause', 'archive', 'approve_publish_intent');
CREATE TYPE "AttractionAssetKind" AS ENUM ('image', 'video', 'transcript', 'testimonial_ref', 'consent_document', 'other');
CREATE TYPE "AttractionAssetStatus" AS ENUM ('captured', 'catalogued', 'in_review', 'approved', 'published', 'review_due', 'retired', 'withdrawn', 'purged');

CREATE TABLE "attraction_documents" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "kind" "AttractionDocumentKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "publish_state" "AttractionPublishState" NOT NULL DEFAULT 'drafting',
    "change_class_default" "AttractionChangeClass" NOT NULL DEFAULT 'B_substantive_copy',
    "surface_path" TEXT,
    "schema_rule_set_key" TEXT NOT NULL,
    "published_revision_id" TEXT,
    "story_capture_ref" TEXT,
    "draft_body" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attraction_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attraction_revisions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "body" JSONB NOT NULL,
    "content_sha256" TEXT NOT NULL,
    "change_class" "AttractionChangeClass" NOT NULL,
    "author_id" TEXT,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attraction_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attraction_approval_events" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "revision_id" TEXT NOT NULL,
    "from_state" "AttractionPublishState" NOT NULL,
    "to_state" "AttractionPublishState" NOT NULL,
    "decision" "AttractionApprovalDecision" NOT NULL,
    "change_class" "AttractionChangeClass" NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "reviewer_role" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "checklist_snapshot" JSONB,
    "reviewed_content_sha256" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attraction_approval_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attraction_schema_validations" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "revision_id" TEXT NOT NULL,
    "rule_set_key" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "violations" JSONB NOT NULL DEFAULT '[]',
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attraction_schema_validations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attraction_assets" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "kind" "AttractionAssetKind" NOT NULL,
    "status" "AttractionAssetStatus" NOT NULL DEFAULT 'captured',
    "title" TEXT NOT NULL DEFAULT '',
    "storage_path" TEXT,
    "mime" TEXT,
    "content_sha256" TEXT,
    "alt_text" TEXT NOT NULL DEFAULT '',
    "caption" TEXT NOT NULL DEFAULT '',
    "taxonomy_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "surface_hints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "consent_ref" TEXT,
    "related_story_ref" TEXT,
    "source_shot_id" TEXT,
    "ai_policy" TEXT NOT NULL DEFAULT 'photo_only',
    "last_reviewed_at" TIMESTAMP(3),
    "next_review_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attraction_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attraction_documents_published_revision_id_key" ON "attraction_documents"("published_revision_id");
CREATE UNIQUE INDEX "attraction_documents_clinic_id_kind_slug_key" ON "attraction_documents"("clinic_id", "kind", "slug");
CREATE INDEX "attraction_documents_clinic_id_publish_state_idx" ON "attraction_documents"("clinic_id", "publish_state");
CREATE INDEX "attraction_documents_clinic_id_kind_idx" ON "attraction_documents"("clinic_id", "kind");

CREATE UNIQUE INDEX "attraction_revisions_document_id_version_number_key" ON "attraction_revisions"("document_id", "version_number");
CREATE INDEX "attraction_revisions_document_id_created_at_idx" ON "attraction_revisions"("document_id", "created_at");
CREATE INDEX "attraction_revisions_content_sha256_idx" ON "attraction_revisions"("content_sha256");

CREATE INDEX "attraction_approval_events_document_id_created_at_idx" ON "attraction_approval_events"("document_id", "created_at");
CREATE INDEX "attraction_approval_events_revision_id_idx" ON "attraction_approval_events"("revision_id");
CREATE INDEX "attraction_approval_events_decision_idx" ON "attraction_approval_events"("decision");

CREATE INDEX "attraction_schema_validations_document_id_revision_id_idx" ON "attraction_schema_validations"("document_id", "revision_id");
CREATE INDEX "attraction_schema_validations_passed_idx" ON "attraction_schema_validations"("passed");

CREATE UNIQUE INDEX "attraction_assets_clinic_id_asset_id_key" ON "attraction_assets"("clinic_id", "asset_id");
CREATE INDEX "attraction_assets_clinic_id_status_idx" ON "attraction_assets"("clinic_id", "status");
CREATE INDEX "attraction_assets_clinic_id_kind_idx" ON "attraction_assets"("clinic_id", "kind");

ALTER TABLE "attraction_documents" ADD CONSTRAINT "attraction_documents_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attraction_revisions" ADD CONSTRAINT "attraction_revisions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "attraction_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attraction_revisions" ADD CONSTRAINT "attraction_revisions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attraction_documents" ADD CONSTRAINT "attraction_documents_published_revision_id_fkey" FOREIGN KEY ("published_revision_id") REFERENCES "attraction_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "attraction_approval_events" ADD CONSTRAINT "attraction_approval_events_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "attraction_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attraction_approval_events" ADD CONSTRAINT "attraction_approval_events_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "attraction_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attraction_approval_events" ADD CONSTRAINT "attraction_approval_events_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attraction_schema_validations" ADD CONSTRAINT "attraction_schema_validations_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "attraction_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attraction_schema_validations" ADD CONSTRAINT "attraction_schema_validations_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "attraction_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attraction_assets" ADD CONSTRAINT "attraction_assets_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
