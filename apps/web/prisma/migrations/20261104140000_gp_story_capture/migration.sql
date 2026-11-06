-- GP Story Capture System (approved proposal)
-- Default-deny reuse policies; versioned consent; placement tracking; human review events.

CREATE TYPE "GpStoryCategory" AS ENUM ('early_career', 'established', 'returning', 'part_time', 'special_interest');
CREATE TYPE "GpStoryStatus" AS ENUM ('invited', 'briefed', 'interviewed', 'drafting', 'gp_review', 'editorial_review', 'changes_requested', 'approved', 'published', 'paused', 'withdrawn', 'archived');
CREATE TYPE "GpStoryFormat" AS ENUM ('pull_quote', 'short_story', 'long_story', 'video');
CREATE TYPE "GpStoryAttribution" AS ENUM ('full_name', 'first_name_only', 'initials', 'role_label_only');
CREATE TYPE "GpStoryConsentStatus" AS ENUM ('not_started', 'summary_shared', 'draft_linked', 'signed', 'expired', 'withdrawn', 'superseded');
CREATE TYPE "GpStoryReuseChannel" AS ENUM ('practice_experience_web', 'gp_opportunities_rail', 'join_our_team_quiet_quote', 'owned_social_og', 'internal_proposal_pack', 'video_embed');
CREATE TYPE "GpStoryReviewDecision" AS ENUM ('approve_advance', 'request_changes', 'pause', 'withdraw', 'archive', 'approve_publish', 'acknowledge_withdrawal');
CREATE TYPE "GpStoryReviewRole" AS ENUM ('practice_manager', 'content_editor', 'brand_governance', 'clinical_lead_or_principal', 'subject_gp');

CREATE TABLE "gp_stories" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "practitioner_id" TEXT,
    "career_application_id" TEXT,
    "working_title" TEXT NOT NULL,
    "subject_display_name" TEXT NOT NULL,
    "subject_email" TEXT,
    "primary_category" "GpStoryCategory" NOT NULL,
    "status" "GpStoryStatus" NOT NULL DEFAULT 'invited',
    "workflow_version" TEXT NOT NULL DEFAULT '1.0.0',
    "interview_scheduled_at" TIMESTAMP(3),
    "interviewed_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "withdrawn_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "special_interest_label" TEXT,
    "honesty_cue_enabled" BOOLEAN NOT NULL DEFAULT true,
    "composite_example_flag" BOOLEAN NOT NULL DEFAULT false,
    "internal_notes" TEXT,
    "attraction_document_id" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "gp_stories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gp_story_category_assignments" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "category" "GpStoryCategory" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,
    CONSTRAINT "gp_story_category_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gp_story_versions" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "format" "GpStoryFormat" NOT NULL,
    "status_snapshot" "GpStoryStatus" NOT NULL,
    "body_text" TEXT NOT NULL,
    "pull_quote_text" TEXT,
    "transcript_text" TEXT,
    "attribution" "GpStoryAttribution" NOT NULL,
    "public_byline" TEXT,
    "structure_json" JSONB,
    "editor_user_id" TEXT,
    "gp_approved_at" TIMESTAMP(3),
    "editorial_approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gp_story_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gp_story_consents" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "consent_version" TEXT NOT NULL,
    "status" "GpStoryConsentStatus" NOT NULL DEFAULT 'not_started',
    "attribution_chosen" "GpStoryAttribution",
    "recording_audio_video" BOOLEAN NOT NULL DEFAULT false,
    "retention_until" TIMESTAMP(3),
    "storage_location_note" TEXT,
    "channels_allowed_json" JSONB NOT NULL DEFAULT '[]',
    "channels_denied_json" JSONB NOT NULL DEFAULT '[]',
    "commercial_silence_ack" BOOLEAN NOT NULL DEFAULT false,
    "patient_privacy_ack" BOOLEAN NOT NULL DEFAULT false,
    "edit_rights_ack" BOOLEAN NOT NULL DEFAULT false,
    "review_window_days" INTEGER NOT NULL DEFAULT 5,
    "withdrawal_sla_days" INTEGER NOT NULL DEFAULT 10,
    "linked_version_id" TEXT,
    "signed_at" TIMESTAMP(3),
    "signed_by_name" TEXT,
    "signed_by_email" TEXT,
    "document_uri" TEXT,
    "withdrawn_at" TIMESTAMP(3),
    "withdrawal_reason" TEXT,
    "superseded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "gp_story_consents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gp_story_reuse_policies" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "channel" "GpStoryReuseChannel" NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "requires_fresh_consent" BOOLEAN NOT NULL DEFAULT false,
    "clinic_scope" TEXT NOT NULL DEFAULT 'flagship_only',
    "notes" TEXT,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gp_story_reuse_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gp_story_placements" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "channel" "GpStoryReuseChannel" NOT NULL,
    "surface_path" TEXT NOT NULL,
    "module_key" TEXT,
    "live" BOOLEAN NOT NULL DEFAULT false,
    "went_live_at" TIMESTAMP(3),
    "taken_down_at" TIMESTAMP(3),
    "take_down_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gp_story_placements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gp_story_review_events" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "from_status" "GpStoryStatus" NOT NULL,
    "to_status" "GpStoryStatus" NOT NULL,
    "decision" "GpStoryReviewDecision" NOT NULL,
    "reviewer_role" "GpStoryReviewRole" NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "checklist_snapshot" JSONB,
    "version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gp_story_review_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gp_story_source_assets" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3),
    "retention_until" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gp_story_source_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gp_stories_clinic_id_status_idx" ON "gp_stories"("clinic_id", "status");
CREATE INDEX "gp_stories_clinic_id_primary_category_idx" ON "gp_stories"("clinic_id", "primary_category");
CREATE INDEX "gp_stories_practitioner_id_idx" ON "gp_stories"("practitioner_id");
CREATE INDEX "gp_stories_published_at_idx" ON "gp_stories"("published_at");

CREATE UNIQUE INDEX "gp_story_category_assignments_story_id_category_key" ON "gp_story_category_assignments"("story_id", "category");
CREATE INDEX "gp_story_category_assignments_category_idx" ON "gp_story_category_assignments"("category");

CREATE UNIQUE INDEX "gp_story_versions_story_id_version_number_format_key" ON "gp_story_versions"("story_id", "version_number", "format");
CREATE INDEX "gp_story_versions_story_id_format_idx" ON "gp_story_versions"("story_id", "format");

CREATE INDEX "gp_story_consents_story_id_status_idx" ON "gp_story_consents"("story_id", "status");
CREATE INDEX "gp_story_consents_consent_version_idx" ON "gp_story_consents"("consent_version");

CREATE UNIQUE INDEX "gp_story_reuse_policies_story_id_channel_key" ON "gp_story_reuse_policies"("story_id", "channel");
CREATE INDEX "gp_story_reuse_policies_channel_allowed_idx" ON "gp_story_reuse_policies"("channel", "allowed");

CREATE INDEX "gp_story_placements_story_id_live_idx" ON "gp_story_placements"("story_id", "live");
CREATE INDEX "gp_story_placements_channel_live_idx" ON "gp_story_placements"("channel", "live");
CREATE INDEX "gp_story_placements_surface_path_idx" ON "gp_story_placements"("surface_path");

CREATE INDEX "gp_story_review_events_story_id_created_at_idx" ON "gp_story_review_events"("story_id", "created_at");
CREATE INDEX "gp_story_review_events_decision_idx" ON "gp_story_review_events"("decision");

CREATE INDEX "gp_story_source_assets_story_id_kind_idx" ON "gp_story_source_assets"("story_id", "kind");

ALTER TABLE "gp_stories" ADD CONSTRAINT "gp_stories_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gp_stories" ADD CONSTRAINT "gp_stories_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gp_stories" ADD CONSTRAINT "gp_stories_career_application_id_fkey" FOREIGN KEY ("career_application_id") REFERENCES "career_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gp_stories" ADD CONSTRAINT "gp_stories_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "gp_story_category_assignments" ADD CONSTRAINT "gp_story_category_assignments_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "gp_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gp_story_versions" ADD CONSTRAINT "gp_story_versions_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "gp_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gp_story_consents" ADD CONSTRAINT "gp_story_consents_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "gp_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gp_story_reuse_policies" ADD CONSTRAINT "gp_story_reuse_policies_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "gp_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gp_story_placements" ADD CONSTRAINT "gp_story_placements_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "gp_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gp_story_placements" ADD CONSTRAINT "gp_story_placements_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "gp_story_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gp_story_review_events" ADD CONSTRAINT "gp_story_review_events_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "gp_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gp_story_review_events" ADD CONSTRAINT "gp_story_review_events_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gp_story_source_assets" ADD CONSTRAINT "gp_story_source_assets_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "gp_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
