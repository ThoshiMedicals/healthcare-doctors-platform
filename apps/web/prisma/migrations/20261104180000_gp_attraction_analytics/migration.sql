-- CreateEnum
CREATE TYPE "GpAttractionSurface" AS ENUM ('gp_opportunities', 'gp_faq', 'doctor_readiness', 'provider_number_readiness', 'gp_session_planner', 'gp_eoi', 'dpa_19ab_navigator', 'practice_support_matrix', 'join_our_team', 'practice_experience', 'opportunity_pack');

-- CreateEnum
CREATE TYPE "GpAttractionPersonaHint" AS ENUM ('early_career_gp', 'established_gp_seeking_change', 'returning_gp', 'part_time_parent_gp', 'special_interest_gp', 'unknown');

-- CreateEnum
CREATE TYPE "GpAttractionChannel" AS ENUM ('direct', 'organic_search', 'referral', 'email', 'social', 'unknown');

-- CreateTable
CREATE TABLE "gp_attraction_events" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "anonymous_session_id" TEXT NOT NULL,
    "surface" "GpAttractionSurface",
    "tool_id" TEXT,
    "path" TEXT,
    "referrer_path" TEXT,
    "faq_id" TEXT,
    "cta_id" TEXT,
    "step_id" TEXT,
    "step_index" INTEGER,
    "last_step_id" TEXT,
    "from_surface" "GpAttractionSurface",
    "to_surface" "GpAttractionSurface",
    "vote" TEXT,
    "eoi_submission_id" TEXT,
    "module_id" TEXT,
    "pack_id" TEXT,
    "persona_hint" "GpAttractionPersonaHint" NOT NULL DEFAULT 'unknown',
    "channel" "GpAttractionChannel" NOT NULL DEFAULT 'unknown',
    "device_class" TEXT,
    "duration_ms" INTEGER,
    "props" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gp_attraction_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_attraction_daily_rollups" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "metric_id" TEXT NOT NULL,
    "dimension" TEXT NOT NULL DEFAULT '_all',
    "value" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gp_attraction_daily_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_attraction_path_rollups" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "window_days" INTEGER NOT NULL,
    "path_key" TEXT NOT NULL,
    "sessions" INTEGER NOT NULL,
    "eoi_sessions" INTEGER NOT NULL,
    "lift_to_eoi" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gp_attraction_path_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_intelligence_signal_daily" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "meta_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_intelligence_signal_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_intelligence_insight_runs" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "period_label" TEXT NOT NULL,
    "window_days" INTEGER NOT NULL DEFAULT 28,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gaps_json" JSONB NOT NULL,
    "unanswered_json" JSONB NOT NULL,
    "high_converting_json" JSONB NOT NULL,
    "monthly_recs_json" JSONB NOT NULL,
    "seo_opportunities_json" JSONB NOT NULL,
    "doctor_info_gaps_json" JSONB NOT NULL,
    "brand_alignment_json" JSONB NOT NULL,
    "created_by_user_id" TEXT,

    CONSTRAINT "content_intelligence_insight_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attraction_knowledge_graph_snapshots" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "window_days" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nodes_json" JSONB NOT NULL,
    "edges_json" JSONB NOT NULL,
    "summary_json" JSONB,

    CONSTRAINT "attraction_knowledge_graph_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gp_attraction_events_clinic_id_occurred_at_idx" ON "gp_attraction_events"("clinic_id", "occurred_at");

-- CreateIndex
CREATE INDEX "gp_attraction_events_clinic_id_name_occurred_at_idx" ON "gp_attraction_events"("clinic_id", "name", "occurred_at");

-- CreateIndex
CREATE INDEX "gp_attraction_events_anonymous_session_id_occurred_at_idx" ON "gp_attraction_events"("anonymous_session_id", "occurred_at");

-- CreateIndex
CREATE INDEX "gp_attraction_events_tool_id_name_idx" ON "gp_attraction_events"("tool_id", "name");

-- CreateIndex
CREATE INDEX "gp_attraction_events_persona_hint_occurred_at_idx" ON "gp_attraction_events"("persona_hint", "occurred_at");

-- CreateIndex
CREATE INDEX "gp_attraction_daily_rollups_clinic_id_day_idx" ON "gp_attraction_daily_rollups"("clinic_id", "day");

-- CreateIndex
CREATE UNIQUE INDEX "gp_attraction_daily_rollups_clinic_id_day_metric_id_dimensi_key" ON "gp_attraction_daily_rollups"("clinic_id", "day", "metric_id", "dimension");

-- CreateIndex
CREATE UNIQUE INDEX "gp_attraction_path_rollups_clinic_id_window_days_path_key_key" ON "gp_attraction_path_rollups"("clinic_id", "window_days", "path_key");

-- CreateIndex
CREATE INDEX "content_intelligence_signal_daily_clinic_id_source_day_idx" ON "content_intelligence_signal_daily"("clinic_id", "source", "day");

-- CreateIndex
CREATE UNIQUE INDEX "content_intelligence_signal_daily_clinic_id_day_source_key_key" ON "content_intelligence_signal_daily"("clinic_id", "day", "source", "key");

-- CreateIndex
CREATE INDEX "content_intelligence_insight_runs_clinic_id_generated_at_idx" ON "content_intelligence_insight_runs"("clinic_id", "generated_at");

-- CreateIndex
CREATE INDEX "attraction_knowledge_graph_snapshots_clinic_id_generated_at_idx" ON "attraction_knowledge_graph_snapshots"("clinic_id", "generated_at");

-- AddForeignKey
ALTER TABLE "gp_attraction_events" ADD CONSTRAINT "gp_attraction_events_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_attraction_daily_rollups" ADD CONSTRAINT "gp_attraction_daily_rollups_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_attraction_path_rollups" ADD CONSTRAINT "gp_attraction_path_rollups_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_intelligence_signal_daily" ADD CONSTRAINT "content_intelligence_signal_daily_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_intelligence_insight_runs" ADD CONSTRAINT "content_intelligence_insight_runs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attraction_knowledge_graph_snapshots" ADD CONSTRAINT "attraction_knowledge_graph_snapshots_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
