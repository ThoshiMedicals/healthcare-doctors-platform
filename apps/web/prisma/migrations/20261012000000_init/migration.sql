-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ClinicStatus" AS ENUM ('live', 'external', 'draft');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('network_admin', 'clinic_admin', 'editor', 'clinical_reviewer', 'practice_approver', 'publisher');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- CreateEnum
CREATE TYPE "PageTemplate" AS ENUM ('home', 'section_hub', 'service', 'practitioner', 'team_hub', 'knowledge_topic', 'knowledge_article', 'update', 'practice_page', 'contact', 'network', 'not_found');

-- CreateEnum
CREATE TYPE "ContentCollection" AS ENUM ('practitioner', 'service', 'practice_information', 'update', 'faq', 'knowledge_topic', 'knowledge_article', 'network_location', 'media', 'navigation');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('draft', 'in_review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('planned', 'assigned', 'drafting', 'clinical_review', 'approved', 'scheduled', 'published', 'review_due', 'on_hold');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('clinical', 'operational', 'institutional');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('awaiting_review', 'in_review', 'approved', 'review_due', 'superseded');

-- CreateEnum
CREATE TYPE "UpdateCategory" AS ENUM ('practice_updates', 'patient_education', 'service_information', 'clinical_governance', 'community_health_information');

-- CreateEnum
CREATE TYPE "MediaAuthenticity" AS ENUM ('unverified', 'verified', 'legacy_production');

-- CreateTable
CREATE TABLE "networks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "positioning" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "network_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "practice_name" TEXT NOT NULL,
    "legal_name" TEXT,
    "status" "ClinicStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_domains" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinic_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_profiles" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "phone_display" TEXT NOT NULL,
    "phone_tel" TEXT NOT NULL,
    "fax_display" TEXT,
    "email" TEXT NOT NULL,
    "street_address" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'AU',
    "localities_served" TEXT[],
    "after_hours_provider" TEXT,
    "after_hours_phone" TEXT,
    "after_hours_page_path" TEXT,
    "booking_page_path" TEXT,
    "hotdoc_url" TEXT,
    "logo_path" TEXT,
    "og_image_path" TEXT,
    "seo_title_suffix" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en-AU',
    "canonical_base_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opening_hours" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "opens" TEXT NOT NULL,
    "closes" TEXT NOT NULL,

    CONSTRAINT "opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "clinic_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinic_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "template" "PageTemplate" NOT NULL,
    "collection" "ContentCollection",
    "indexable" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "canonical_path" TEXT NOT NULL,
    "robots" TEXT NOT NULL DEFAULT 'index,follow,max-image-preview:large',
    "open_graph" JSONB,
    "breadcrumb" JSONB,
    "status" "PageStatus" NOT NULL DEFAULT 'draft',
    "published_revision_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_revisions" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "html" TEXT NOT NULL DEFAULT '',
    "body" JSONB NOT NULL,
    "content_sha256" TEXT NOT NULL,
    "author_id" TEXT,
    "immutable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_items" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "section_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_ownership" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "section_key" TEXT NOT NULL,
    "is_hub" BOOLEAN NOT NULL DEFAULT false,
    "breadcrumb" JSONB NOT NULL,

    CONSTRAINT "navigation_ownership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practitioners" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "page_id" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "biography" TEXT NOT NULL DEFAULT '',
    "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "areas_of_care" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "professional_interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "related_services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "booking_url" TEXT,
    "portrait_path" TEXT,
    "status" "PublicationStatus" NOT NULL DEFAULT 'planned',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practitioners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "page_id" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "patient_education" JSONB,
    "why_it_matters" JSONB,
    "how_we_help" JSONB,
    "next_step" JSONB,
    "faqs" JSONB,
    "related_practitioners" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "related_services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PublicationStatus" NOT NULL DEFAULT 'planned',
    "content_owner" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_topics" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "page_id" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "status" "PublicationStatus" NOT NULL DEFAULT 'planned',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_articles" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "page_id" TEXT,
    "topic_id" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "summary" TEXT NOT NULL DEFAULT '',
    "educational_content" JSONB,
    "when_to_seek_medical_advice" JSONB,
    "how_gp_can_help" JSONB,
    "related_services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "related_practitioners" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "faqs" JSONB,
    "trusted_sources" JSONB,
    "booking_cta" JSONB,
    "seo" JSONB,
    "status" "PublicationStatus" NOT NULL DEFAULT 'planned',
    "content_owner" TEXT,
    "due_date" TIMESTAMP(3),
    "planned_publication_date" TIMESTAMP(3),
    "publication_date" TIMESTAMP(3),
    "next_review_date" TIMESTAMP(3),
    "article_path" TEXT,
    "seo_review_complete" BOOLEAN NOT NULL DEFAULT false,
    "source_verification_complete" BOOLEAN NOT NULL DEFAULT false,
    "internal_links_verified" BOOLEAN NOT NULL DEFAULT false,
    "accessibility_review_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_updates" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "page_id" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "UpdateCategory" NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "image_path" TEXT,
    "image_alt" TEXT,
    "author" TEXT,
    "sections" JSONB,
    "audience" TEXT,
    "status" "PublicationStatus" NOT NULL DEFAULT 'planned',
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'awaiting_review',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "related_page" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'planned',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_pages" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "page_id" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "sections" JSONB,
    "related_pages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PublicationStatus" NOT NULL DEFAULT 'planned',
    "content_owner" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL DEFAULT '',
    "subject" TEXT,
    "source" TEXT,
    "authenticity_status" "MediaAuthenticity" NOT NULL DEFAULT 'unverified',
    "usage" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content_sha256" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_locations" (
    "id" TEXT NOT NULL,
    "network_id" TEXT NOT NULL,
    "linked_clinic_id" TEXT,
    "clinic_name" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "website" TEXT,
    "booking_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ClinicStatus" NOT NULL DEFAULT 'external',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_reviews" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "collection" "ContentCollection",
    "review_type" "ReviewType" NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'awaiting_review',
    "reviewed_by" TEXT,
    "content_owner" TEXT,
    "last_reviewed" TIMESTAMP(3),
    "next_review" TIMESTAMP(3),
    "content_owner_submitted_by" TEXT,
    "content_owner_submitted_at" TIMESTAMP(3),
    "reviewer_signed_by" TEXT,
    "reviewer_signed_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "approval_reference" TEXT,
    "evidence_reference" TEXT,
    "reviewed_content_sha256" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editorial_items" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "page_id" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "theme" TEXT NOT NULL,
    "primary_category" TEXT NOT NULL,
    "content_owner" TEXT,
    "due_date" TIMESTAMP(3),
    "status" "PublicationStatus" NOT NULL DEFAULT 'planned',
    "planned_publication_date" TIMESTAMP(3),
    "publication_date" TIMESTAMP(3),
    "next_review_date" TIMESTAMP(3),
    "article_path" TEXT,
    "source_verification_complete" BOOLEAN NOT NULL DEFAULT false,
    "seo_review_complete" BOOLEAN NOT NULL DEFAULT false,
    "accessibility_review_complete" BOOLEAN NOT NULL DEFAULT false,
    "internal_links_verified" BOOLEAN NOT NULL DEFAULT false,
    "live_verified_by" TEXT,
    "live_verified_at" TIMESTAMP(3),
    "history" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editorial_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_documents" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "headings" JSONB NOT NULL DEFAULT '[]',
    "section" TEXT NOT NULL,
    "related" JSONB NOT NULL DEFAULT '[]',
    "body_text" TEXT NOT NULL DEFAULT '',
    "shard" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_requests" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "form_type" TEXT NOT NULL,
    "delivery" TEXT,
    "privacy_confirmed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinics_slug_key" ON "clinics"("slug");

-- CreateIndex
CREATE INDEX "clinics_network_id_idx" ON "clinics"("network_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_domains_hostname_key" ON "clinic_domains"("hostname");

-- CreateIndex
CREATE INDEX "clinic_domains_clinic_id_idx" ON "clinic_domains"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_profiles_clinic_id_key" ON "clinic_profiles"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "opening_hours_clinic_id_day_of_week_key" ON "opening_hours"("clinic_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "clinic_memberships_clinic_id_idx" ON "clinic_memberships"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_memberships_user_id_clinic_id_key" ON "clinic_memberships"("user_id", "clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "pages_published_revision_id_key" ON "pages"("published_revision_id");

-- CreateIndex
CREATE INDEX "pages_clinic_id_status_idx" ON "pages"("clinic_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pages_clinic_id_path_key" ON "pages"("clinic_id", "path");

-- CreateIndex
CREATE INDEX "page_revisions_page_id_idx" ON "page_revisions"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_items_clinic_id_section_key_key" ON "navigation_items"("clinic_id", "section_key");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_ownership_page_id_key" ON "navigation_ownership"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "practitioners_page_id_key" ON "practitioners"("page_id");

-- CreateIndex
CREATE INDEX "practitioners_clinic_id_status_idx" ON "practitioners"("clinic_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "practitioners_clinic_id_slug_key" ON "practitioners"("clinic_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "services_page_id_key" ON "services"("page_id");

-- CreateIndex
CREATE INDEX "services_clinic_id_status_idx" ON "services"("clinic_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "services_clinic_id_slug_key" ON "services"("clinic_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_topics_page_id_key" ON "knowledge_topics"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_topics_clinic_id_slug_key" ON "knowledge_topics"("clinic_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_articles_page_id_key" ON "knowledge_articles"("page_id");

-- CreateIndex
CREATE INDEX "knowledge_articles_clinic_id_status_idx" ON "knowledge_articles"("clinic_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_articles_clinic_id_slug_key" ON "knowledge_articles"("clinic_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "practice_updates_page_id_key" ON "practice_updates"("page_id");

-- CreateIndex
CREATE INDEX "practice_updates_clinic_id_status_idx" ON "practice_updates"("clinic_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "practice_updates_clinic_id_slug_key" ON "practice_updates"("clinic_id", "slug");

-- CreateIndex
CREATE INDEX "faqs_clinic_id_category_idx" ON "faqs"("clinic_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "practice_pages_page_id_key" ON "practice_pages"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "practice_pages_clinic_id_slug_key" ON "practice_pages"("clinic_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_clinic_id_storage_path_key" ON "media_assets"("clinic_id", "storage_path");

-- CreateIndex
CREATE INDEX "network_locations_network_id_idx" ON "network_locations"("network_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_reviews_page_id_key" ON "clinical_reviews"("page_id");

-- CreateIndex
CREATE INDEX "clinical_reviews_clinic_id_status_idx" ON "clinical_reviews"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "editorial_items_clinic_id_year_month_idx" ON "editorial_items"("clinic_id", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "search_documents_page_id_key" ON "search_documents"("page_id");

-- CreateIndex
CREATE INDEX "search_documents_clinic_id_shard_idx" ON "search_documents"("clinic_id", "shard");

-- CreateIndex
CREATE INDEX "form_requests_clinic_id_created_at_idx" ON "form_requests"("clinic_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_clinic_id_created_at_idx" ON "audit_logs"("clinic_id", "created_at");

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_domains" ADD CONSTRAINT "clinic_domains_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_profiles" ADD CONSTRAINT "clinic_profiles_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_memberships" ADD CONSTRAINT "clinic_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_memberships" ADD CONSTRAINT "clinic_memberships_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_published_revision_id_fkey" FOREIGN KEY ("published_revision_id") REFERENCES "page_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_revisions" ADD CONSTRAINT "page_revisions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_revisions" ADD CONSTRAINT "page_revisions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_ownership" ADD CONSTRAINT "navigation_ownership_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practitioners" ADD CONSTRAINT "practitioners_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practitioners" ADD CONSTRAINT "practitioners_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_topics" ADD CONSTRAINT "knowledge_topics_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_topics" ADD CONSTRAINT "knowledge_topics_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "knowledge_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_updates" ADD CONSTRAINT "practice_updates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_updates" ADD CONSTRAINT "practice_updates_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_pages" ADD CONSTRAINT "practice_pages_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_pages" ADD CONSTRAINT "practice_pages_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_locations" ADD CONSTRAINT "network_locations_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "networks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_locations" ADD CONSTRAINT "network_locations_linked_clinic_id_fkey" FOREIGN KEY ("linked_clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_reviews" ADD CONSTRAINT "clinical_reviews_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_reviews" ADD CONSTRAINT "clinical_reviews_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorial_items" ADD CONSTRAINT "editorial_items_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorial_items" ADD CONSTRAINT "editorial_items_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_requests" ADD CONSTRAINT "form_requests_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
