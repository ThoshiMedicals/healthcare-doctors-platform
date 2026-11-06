-- CreateTable
CREATE TABLE "search_demand_signals" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "normalized_term" TEXT NOT NULL,
    "intent_bucket" TEXT NOT NULL DEFAULT 'unmatched',
    "result_type" TEXT NOT NULL DEFAULT '',
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "no_result" BOOLEAN NOT NULL DEFAULT false,
    "clicked_result_path" TEXT,
    "clicked_step" TEXT,
    "practitioner_slug" TEXT,
    "page_path" TEXT NOT NULL DEFAULT '',
    "session_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_demand_signals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_demand_signals_clinic_id_occurred_at_idx" ON "search_demand_signals"("clinic_id", "occurred_at");

-- CreateIndex
CREATE INDEX "search_demand_signals_clinic_id_normalized_term_occurred_at_idx" ON "search_demand_signals"("clinic_id", "normalized_term", "occurred_at");

-- CreateIndex
CREATE INDEX "search_demand_signals_clinic_id_no_result_occurred_at_idx" ON "search_demand_signals"("clinic_id", "no_result", "occurred_at");

-- CreateIndex
CREATE INDEX "search_demand_signals_clinic_id_practitioner_slug_occurred_at_idx" ON "search_demand_signals"("clinic_id", "practitioner_slug", "occurred_at");

-- AddForeignKey
ALTER TABLE "search_demand_signals" ADD CONSTRAINT "search_demand_signals_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
