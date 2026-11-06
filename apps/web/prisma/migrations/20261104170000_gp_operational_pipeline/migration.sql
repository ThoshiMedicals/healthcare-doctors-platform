-- CreateEnum
CREATE TYPE "GpEnquiryStatus" AS ENUM ('new_submission', 'triage', 'reviewing', 'awaiting_doctor', 'in_conversation', 'onboarding', 'nurture', 'declined', 'withdrawn', 'hired');

-- CreateEnum
CREATE TYPE "GpEnquiryScoreBand" AS ENUM ('priority_review', 'strong_fit', 'possible_fit', 'nurture', 'incomplete');

-- CreateEnum
CREATE TYPE "GpEnquiryCapacityFit" AS ENUM ('strong', 'limited', 'uncertain', 'unknown');

-- CreateEnum
CREATE TYPE "GpEligibilityDiscussionStatus" AS ENUM ('not_started', 'in_discussion', 'practice_location_shared', 'doctor_seeking_external_advice', 'paused', 'closed_no_determination');

-- CreateEnum
CREATE TYPE "GpOnboardingCaseStatus" AS ENUM ('enquiry', 'eoi_received', 'in_review', 'awaiting_doctor', 'awaiting_external', 'ready_for_go_live', 'live', 'settling', 'paused', 'withdrawn', 'declined');

-- CreateEnum
CREATE TYPE "GpOnboardingStageId" AS ENUM ('initial_discussion', 'eoi_review', 'credential_checks', 'provider_number_preparation', 'session_allocation', 'orientation', 'go_live');

-- CreateEnum
CREATE TYPE "GpOnboardingStageStatus" AS ENUM ('not_started', 'in_progress', 'awaiting_doctor', 'awaiting_external', 'ready_for_gate', 'gate_approved', 'skipped_with_rationale', 'blocked');

-- CreateEnum
CREATE TYPE "GpOnboardingTaskOwner" AS ENUM ('admin', 'doctor', 'external');

-- CreateEnum
CREATE TYPE "GpOnboardingTaskStatus" AS ENUM ('pending', 'in_progress', 'done', 'waived_with_rationale', 'blocked');

-- CreateEnum
CREATE TYPE "GpOnboardingGateDecision" AS ENUM ('approve_advance', 'request_changes', 'pause', 'decline', 'withdraw', 'acknowledge_awaiting_external');

-- CreateEnum
CREATE TYPE "SessionDayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');

-- CreateEnum
CREATE TYPE "SessionPeriod" AS ENUM ('morning', 'afternoon', 'evening');

-- CreateEnum
CREATE TYPE "MatchRunSource" AS ENUM ('admin_manual', 'enquiry_session_prefs', 'session_planner', 'onboarding_allocation');

-- CreateEnum
CREATE TYPE "GpFirst90Phase" AS ENUM ('day1', 'week1', 'month1', 'month2', 'month3');

-- CreateEnum
CREATE TYPE "GpFirst90CaseStatus" AS ENUM ('active', 'review_due', 'closed_bau', 'closed_staged_growth', 'withdrawn');

-- AlterTable
ALTER TABLE "form_requests" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "gp_doctor_readiness_results" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "applicant_email" TEXT,
    "applicant_name" TEXT,
    "overallBand" TEXT NOT NULL,
    "total_score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "next_action_id" TEXT,
    "answers_json" JSONB NOT NULL,
    "theme_scores_json" JSONB NOT NULL DEFAULT '{}',
    "summary_json" JSONB,
    "advisory_only" BOOLEAN NOT NULL DEFAULT true,
    "enquiry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gp_doctor_readiness_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_enquiries" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "career_application_id" TEXT,
    "doctor_display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" "GpEnquiryStatus" NOT NULL DEFAULT 'new_submission',
    "assigned_to_user_id" TEXT,
    "assigned_to_name" TEXT,
    "priority_score" INTEGER NOT NULL DEFAULT 0,
    "score_band" "GpEnquiryScoreBand" NOT NULL DEFAULT 'incomplete',
    "hard_flags_json" JSONB NOT NULL DEFAULT '[]',
    "capacity_fit" "GpEnquiryCapacityFit" NOT NULL DEFAULT 'unknown',
    "capacity_fit_note" TEXT,
    "eligibility_discussion_status" "GpEligibilityDiscussionStatus" NOT NULL DEFAULT 'not_started',
    "eligibility_discussion_summary" TEXT,
    "preferred_start_date" TIMESTAMP(3),
    "sessions_per_week" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'join_our_team',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gp_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_enquiry_eoi_snapshots" (
    "id" TEXT NOT NULL,
    "enquiry_id" TEXT NOT NULL,
    "ahpra_status" TEXT,
    "fellowship" TEXT,
    "clinical_interests" JSONB NOT NULL DEFAULT '[]',
    "availability_notes" TEXT,
    "raw_summary_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gp_enquiry_eoi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_enquiry_session_preferences" (
    "id" TEXT NOT NULL,
    "enquiry_id" TEXT NOT NULL,
    "preferred_days_json" JSONB NOT NULL DEFAULT '[]',
    "sessions_per_week" DOUBLE PRECISION,
    "start_flexibility" TEXT,
    "notes" TEXT,
    "plan_json" JSONB,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "gp_enquiry_session_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_enquiry_notes" (
    "id" TEXT NOT NULL,
    "enquiry_id" TEXT NOT NULL,
    "author_user_id" TEXT NOT NULL,
    "author_name" TEXT,
    "body" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gp_enquiry_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_enquiry_status_audits" (
    "id" TEXT NOT NULL,
    "enquiry_id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "actor_name" TEXT,
    "from_status" TEXT,
    "to_status" TEXT,
    "field" TEXT,
    "from_value" TEXT,
    "to_value" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gp_enquiry_status_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacity_session_windows" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "day_of_week" "SessionDayOfWeek" NOT NULL,
    "period" "SessionPeriod" NOT NULL,
    "starts_at" TEXT NOT NULL,
    "ends_at" TEXT NOT NULL,
    "is_offered" BOOLEAN NOT NULL DEFAULT true,
    "active_rooms" INTEGER NOT NULL DEFAULT 0,
    "reserve_slots" INTEGER NOT NULL DEFAULT 0,
    "nursing_json" JSONB NOT NULL DEFAULT '{}',
    "existing_gps_json" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capacity_session_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_capacity_match_runs" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "source" "MatchRunSource" NOT NULL DEFAULT 'admin_manual',
    "enquiry_id" TEXT,
    "onboarding_case_id" TEXT,
    "doctor_display_name" TEXT,
    "preferred_keys_json" JSONB NOT NULL,
    "compatibility_score" INTEGER NOT NULL,
    "breakdown_json" JSONB NOT NULL,
    "available_options_json" JSONB NOT NULL,
    "alternatives_json" JSONB NOT NULL,
    "capacity_snapshot_json" JSONB,
    "notice" TEXT NOT NULL DEFAULT 'Advisory only. Session allocation requires human confirmation.',
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_capacity_match_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_onboarding_cases" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "doctor_display_name" TEXT NOT NULL,
    "doctor_email" TEXT,
    "enquiry_id" TEXT,
    "career_application_id" TEXT,
    "status" "GpOnboardingCaseStatus" NOT NULL DEFAULT 'enquiry',
    "current_stage_id" "GpOnboardingStageId" NOT NULL DEFAULT 'initial_discussion',
    "workflow_version" TEXT NOT NULL DEFAULT '1.0.0',
    "target_start_date" TIMESTAMP(3),
    "first_session_at" TIMESTAMP(3),
    "day_one_support_contact" TEXT,
    "provider_number_note" TEXT,
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gp_onboarding_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_onboarding_stage_states" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "stage_id" "GpOnboardingStageId" NOT NULL,
    "status" "GpOnboardingStageStatus" NOT NULL DEFAULT 'not_started',
    "started_at" TIMESTAMP(3),
    "ready_for_gate_at" TIMESTAMP(3),
    "gate_approved_at" TIMESTAMP(3),
    "external_agency" TEXT,
    "blocker_summary" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gp_onboarding_stage_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_onboarding_tasks" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "stage_id" "GpOnboardingStageId" NOT NULL,
    "task_key" TEXT NOT NULL,
    "owner" "GpOnboardingTaskOwner" NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" "GpOnboardingTaskStatus" NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gp_onboarding_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_onboarding_gate_events" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "stage_id" "GpOnboardingStageId" NOT NULL,
    "decision" "GpOnboardingGateDecision" NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "checklist_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gp_onboarding_gate_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_first90_settling_cases" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "onboarding_case_id" TEXT NOT NULL,
    "doctor_display_name" TEXT NOT NULL,
    "status" "GpFirst90CaseStatus" NOT NULL DEFAULT 'active',
    "current_phase" "GpFirst90Phase" NOT NULL DEFAULT 'day1',
    "go_live_at" TIMESTAMP(3) NOT NULL,
    "review_due_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "close_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gp_first90_settling_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_first90_checklist_items" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "item_key" TEXT NOT NULL,
    "phase" "GpFirst90Phase" NOT NULL,
    "owner" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "done_at" TIMESTAMP(3),
    "done_by" TEXT,
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gp_first90_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gp_pipeline_notification_logs" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "recipient_role" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "enquiry_id" TEXT,
    "onboarding_case_id" TEXT,
    "counts_as_approval" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gp_pipeline_notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gp_doctor_readiness_results_enquiry_id_key" ON "gp_doctor_readiness_results"("enquiry_id");

-- CreateIndex
CREATE INDEX "gp_doctor_readiness_results_clinic_id_created_at_idx" ON "gp_doctor_readiness_results"("clinic_id", "created_at");

-- CreateIndex
CREATE INDEX "gp_doctor_readiness_results_applicant_email_idx" ON "gp_doctor_readiness_results"("applicant_email");

-- CreateIndex
CREATE UNIQUE INDEX "gp_enquiries_career_application_id_key" ON "gp_enquiries"("career_application_id");

-- CreateIndex
CREATE INDEX "gp_enquiries_clinic_id_status_priority_score_idx" ON "gp_enquiries"("clinic_id", "status", "priority_score");

-- CreateIndex
CREATE INDEX "gp_enquiries_clinic_id_assigned_to_user_id_idx" ON "gp_enquiries"("clinic_id", "assigned_to_user_id");

-- CreateIndex
CREATE INDEX "gp_enquiries_clinic_id_submitted_at_idx" ON "gp_enquiries"("clinic_id", "submitted_at");

-- CreateIndex
CREATE INDEX "gp_enquiries_email_idx" ON "gp_enquiries"("email");

-- CreateIndex
CREATE UNIQUE INDEX "gp_enquiry_eoi_snapshots_enquiry_id_key" ON "gp_enquiry_eoi_snapshots"("enquiry_id");

-- CreateIndex
CREATE UNIQUE INDEX "gp_enquiry_session_preferences_enquiry_id_key" ON "gp_enquiry_session_preferences"("enquiry_id");

-- CreateIndex
CREATE INDEX "gp_enquiry_notes_enquiry_id_created_at_idx" ON "gp_enquiry_notes"("enquiry_id", "created_at");

-- CreateIndex
CREATE INDEX "gp_enquiry_status_audits_enquiry_id_created_at_idx" ON "gp_enquiry_status_audits"("enquiry_id", "created_at");

-- CreateIndex
CREATE INDEX "capacity_session_windows_clinic_id_is_offered_idx" ON "capacity_session_windows"("clinic_id", "is_offered");

-- CreateIndex
CREATE UNIQUE INDEX "capacity_session_windows_clinic_id_day_of_week_period_key" ON "capacity_session_windows"("clinic_id", "day_of_week", "period");

-- CreateIndex
CREATE INDEX "session_capacity_match_runs_clinic_id_created_at_idx" ON "session_capacity_match_runs"("clinic_id", "created_at");

-- CreateIndex
CREATE INDEX "session_capacity_match_runs_enquiry_id_idx" ON "session_capacity_match_runs"("enquiry_id");

-- CreateIndex
CREATE UNIQUE INDEX "gp_onboarding_cases_enquiry_id_key" ON "gp_onboarding_cases"("enquiry_id");

-- CreateIndex
CREATE INDEX "gp_onboarding_cases_clinic_id_status_idx" ON "gp_onboarding_cases"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "gp_onboarding_stage_states_status_idx" ON "gp_onboarding_stage_states"("status");

-- CreateIndex
CREATE UNIQUE INDEX "gp_onboarding_stage_states_case_id_stage_id_key" ON "gp_onboarding_stage_states"("case_id", "stage_id");

-- CreateIndex
CREATE INDEX "gp_onboarding_tasks_case_id_stage_id_status_idx" ON "gp_onboarding_tasks"("case_id", "stage_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "gp_onboarding_tasks_case_id_task_key_key" ON "gp_onboarding_tasks"("case_id", "task_key");

-- CreateIndex
CREATE INDEX "gp_onboarding_gate_events_case_id_stage_id_created_at_idx" ON "gp_onboarding_gate_events"("case_id", "stage_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "gp_first90_settling_cases_onboarding_case_id_key" ON "gp_first90_settling_cases"("onboarding_case_id");

-- CreateIndex
CREATE INDEX "gp_first90_settling_cases_clinic_id_status_idx" ON "gp_first90_settling_cases"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "gp_first90_checklist_items_case_id_phase_done_idx" ON "gp_first90_checklist_items"("case_id", "phase", "done");

-- CreateIndex
CREATE UNIQUE INDEX "gp_first90_checklist_items_case_id_item_key_key" ON "gp_first90_checklist_items"("case_id", "item_key");

-- CreateIndex
CREATE INDEX "gp_pipeline_notification_logs_clinic_id_sent_at_idx" ON "gp_pipeline_notification_logs"("clinic_id", "sent_at");

-- CreateIndex
CREATE INDEX "gp_pipeline_notification_logs_enquiry_id_idx" ON "gp_pipeline_notification_logs"("enquiry_id");

-- CreateIndex
CREATE INDEX "gp_pipeline_notification_logs_onboarding_case_id_idx" ON "gp_pipeline_notification_logs"("onboarding_case_id");

-- AddForeignKey
ALTER TABLE "gp_doctor_readiness_results" ADD CONSTRAINT "gp_doctor_readiness_results_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_doctor_readiness_results" ADD CONSTRAINT "gp_doctor_readiness_results_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "gp_enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_enquiries" ADD CONSTRAINT "gp_enquiries_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_enquiries" ADD CONSTRAINT "gp_enquiries_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_enquiry_eoi_snapshots" ADD CONSTRAINT "gp_enquiry_eoi_snapshots_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "gp_enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_enquiry_session_preferences" ADD CONSTRAINT "gp_enquiry_session_preferences_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "gp_enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_enquiry_notes" ADD CONSTRAINT "gp_enquiry_notes_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "gp_enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_enquiry_notes" ADD CONSTRAINT "gp_enquiry_notes_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_enquiry_status_audits" ADD CONSTRAINT "gp_enquiry_status_audits_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "gp_enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_enquiry_status_audits" ADD CONSTRAINT "gp_enquiry_status_audits_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacity_session_windows" ADD CONSTRAINT "capacity_session_windows_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_capacity_match_runs" ADD CONSTRAINT "session_capacity_match_runs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_capacity_match_runs" ADD CONSTRAINT "session_capacity_match_runs_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "gp_enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_onboarding_cases" ADD CONSTRAINT "gp_onboarding_cases_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_onboarding_cases" ADD CONSTRAINT "gp_onboarding_cases_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "gp_enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_onboarding_stage_states" ADD CONSTRAINT "gp_onboarding_stage_states_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "gp_onboarding_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_onboarding_tasks" ADD CONSTRAINT "gp_onboarding_tasks_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "gp_onboarding_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_onboarding_gate_events" ADD CONSTRAINT "gp_onboarding_gate_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "gp_onboarding_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_onboarding_gate_events" ADD CONSTRAINT "gp_onboarding_gate_events_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_first90_settling_cases" ADD CONSTRAINT "gp_first90_settling_cases_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_first90_settling_cases" ADD CONSTRAINT "gp_first90_settling_cases_onboarding_case_id_fkey" FOREIGN KEY ("onboarding_case_id") REFERENCES "gp_onboarding_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_first90_checklist_items" ADD CONSTRAINT "gp_first90_checklist_items_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "gp_first90_settling_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_pipeline_notification_logs" ADD CONSTRAINT "gp_pipeline_notification_logs_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "gp_enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gp_pipeline_notification_logs" ADD CONSTRAINT "gp_pipeline_notification_logs_onboarding_case_id_fkey" FOREIGN KEY ("onboarding_case_id") REFERENCES "gp_onboarding_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "content_revisions_clinic_id_entity_type_entity_id_created_at_id" RENAME TO "content_revisions_clinic_id_entity_type_entity_id_created_a_idx";

-- RenameIndex
ALTER INDEX "search_demand_signals_clinic_id_practitioner_slug_occurred_at_i" RENAME TO "search_demand_signals_clinic_id_practitioner_slug_occurred__idx";

