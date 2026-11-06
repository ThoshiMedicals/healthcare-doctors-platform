-- Multi-tenant foundation (Phase 1): optional per-clinic golden root; soften vacancy location default.
ALTER TABLE "clinics" ADD COLUMN "golden_html_root" TEXT;

ALTER TABLE "vacancies" ALTER COLUMN "location" SET DEFAULT '';
