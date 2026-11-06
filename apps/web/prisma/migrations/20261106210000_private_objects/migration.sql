-- Durable private document blobs for Hostinger staging (and similar hosts).
-- Access only via Prisma/app role; Data API remains revoked for anon.

CREATE TABLE "private_objects" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "private_objects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "private_objects_object_key_key" ON "private_objects"("object_key");
CREATE INDEX "private_objects_clinic_id_purpose_created_at_idx" ON "private_objects"("clinic_id", "purpose", "created_at");

ALTER TABLE "private_objects" ADD CONSTRAINT "private_objects_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
