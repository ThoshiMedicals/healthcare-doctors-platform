-- Attraction content frameworks: catchment, continuity network, clinical interests.

ALTER TYPE "AttractionDocumentKind" ADD VALUE IF NOT EXISTS 'catchment_analysis';
ALTER TYPE "AttractionDocumentKind" ADD VALUE IF NOT EXISTS 'continuity_network';
ALTER TYPE "AttractionDocumentKind" ADD VALUE IF NOT EXISTS 'clinical_interests';
