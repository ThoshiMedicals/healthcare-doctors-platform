/**
 * Compatibility shim — Attraction CMS Phase 1 callers.
 * Prefer `@/asset-library/registry` for new code.
 */
export {
  listLibraryAssets as listAttractionAssets,
  upsertLibraryAsset as upsertAttractionAsset,
  type UpsertLibraryAssetInput as UpsertAttractionAssetInput,
} from "@/asset-library/registry";
