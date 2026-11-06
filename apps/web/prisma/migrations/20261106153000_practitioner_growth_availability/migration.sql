-- Practitioner growth & availability (patient-acquisition flags). CMS-controlled; no HotDoc live sync.
ALTER TABLE "practitioners" ADD COLUMN "accepting_new_patients" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "practitioners" ADD COLUMN "new_to_practice_at" TIMESTAMP(3);
ALTER TABLE "practitioners" ADD COLUMN "availability_status" TEXT NOT NULL DEFAULT 'available_this_week';
