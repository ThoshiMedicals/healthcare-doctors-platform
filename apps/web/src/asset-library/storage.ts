/**
 * Storage architecture for Attraction Asset Library.
 *
 * Phase now: public web placeholders under /assets/attraction/ (and legacy PE paths).
 * Later: object storage masters + derivatives; assetId stays stable; swap via replaceablePath.
 */

export const ATTRACTION_ASSET_ROOT = "attraction-assets";

export const STORAGE_FOLDERS = {
  consent: `${ATTRACTION_ASSET_ROOT}/_consent`,
  imageMasters: `${ATTRACTION_ASSET_ROOT}/images/masters`,
  imageDerivatives: `${ATTRACTION_ASSET_ROOT}/images/derivatives`,
  videoMasters: `${ATTRACTION_ASSET_ROOT}/video/masters`,
  videoDelivers: `${ATTRACTION_ASSET_ROOT}/video/delivers`,
  transcripts: `${ATTRACTION_ASSET_ROOT}/transcripts`,
  testimonials: `${ATTRACTION_ASSET_ROOT}/testimonials`,
  quotes: `${ATTRACTION_ASSET_ROOT}/quotes`,
  quarantine: `${ATTRACTION_ASSET_ROOT}/_quarantine`,
  archive: `${ATTRACTION_ASSET_ROOT}/_archive`,
  /** Served AI placeholders (git-friendly public web path) */
  publicPlaceholders: "assets/attraction/placeholders",
} as const;

/** Filename rule: {ASSET_ID}__{kebab-scene}__{yyyy-mm}.{ext} */
export function buildAssetFilename(input: {
  assetId: string;
  scene: string;
  yearMonth?: string;
  ext: string;
}): string {
  const ym = input.yearMonth ?? new Date().toISOString().slice(0, 7);
  const scene = input.scene.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  return `${input.assetId}__${scene}__${ym}.${input.ext.replace(/^\./, "")}`;
}

export function publicPlaceholderUrl(filename: string): string {
  return `/${STORAGE_FOLDERS.publicPlaceholders}/${filename}`;
}

export function masterObjectKey(kind: "image" | "video" | "transcript" | "quote", filename: string): string {
  switch (kind) {
    case "image":
      return `${STORAGE_FOLDERS.imageMasters}/${filename}`;
    case "video":
      return `${STORAGE_FOLDERS.videoMasters}/${filename}`;
    case "transcript":
      return `${STORAGE_FOLDERS.transcripts}/${filename}`;
    case "quote":
      return `${STORAGE_FOLDERS.quotes}/${filename}`;
  }
}

export type DerivativeSpec = {
  key: string;
  role: "web" | "og" | "mobile" | "poster" | "vtt" | "txt";
  width?: number;
  height?: number;
  path: string;
};

export function defaultImageDerivatives(assetId: string): DerivativeSpec[] {
  return [
    {
      key: "web-1200",
      role: "web",
      width: 1200,
      height: 800,
      path: `${STORAGE_FOLDERS.imageDerivatives}/${assetId}__web-1200.webp`,
    },
    {
      key: "og-1200x630",
      role: "og",
      width: 1200,
      height: 630,
      path: `${STORAGE_FOLDERS.imageDerivatives}/${assetId}__og-1200x630.webp`,
    },
  ];
}
