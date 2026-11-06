import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterMediaLibrary,
  formatByteSize,
  formatDimensions,
  inferMediaCategory,
  isMediaLibraryCategory,
  mediaLibraryDashboardStats,
  mediaLibraryPickerHref,
  type MediaLibraryItem,
} from "./media-library-shared";

function item(partial: Partial<MediaLibraryItem> & Pick<MediaLibraryItem, "id" | "filename" | "storagePath">): MediaLibraryItem {
  return {
    title: partial.title ?? partial.filename,
    category: partial.category ?? "General",
    assetType: partial.assetType ?? "Content image",
    altText: partial.altText ?? "",
    uploadedBy: partial.uploadedBy ?? null,
    createdAt: partial.createdAt ?? new Date("2026-11-01T00:00:00.000Z"),
    updatedAt: partial.updatedAt ?? new Date("2026-11-01T00:00:00.000Z"),
    lastUsedAt: partial.lastUsedAt ?? null,
    usage: partial.usage ?? [],
    usageCount: partial.usageCount ?? (partial.usage?.length ?? 0),
    byteSize: partial.byteSize ?? null,
    width: partial.width ?? null,
    height: partial.height ?? null,
    replacementStatus: partial.replacementStatus ?? null,
    previewUrl: partial.previewUrl ?? `/${partial.storagePath}`,
    ...partial,
  };
}

describe("media library categories", () => {
  it("maps storage paths and usage into the approved categories", () => {
    assert.equal(inferMediaCategory("assets/team/dr-tanya.webp"), "Practitioners");
    assert.equal(inferMediaCategory("assets/services/womens-health.webp", ["services/womens-health.html"]), "Services");
    assert.equal(inferMediaCategory("assets/knowledge/adhd.webp", ["knowledge-centre/adhd.html"]), "Knowledge Hub");
    assert.equal(inferMediaCategory("assets/brand/logo.png", ["join-our-team.html"]), "Careers");
    assert.equal(inferMediaCategory("assets/diagrams/peers.webp"), "Authority Diagrams");
    assert.equal(inferMediaCategory("assets/forms/privacy.webp", ["patient-information.html"]), "Patient Information");
    assert.equal(inferMediaCategory("assets/hero-final-desktop.webp"), "General");
    assert.equal(isMediaLibraryCategory("Practitioners"), true);
    assert.equal(isMediaLibraryCategory("Random"), false);
  });
});

describe("media library filters and widgets", () => {
  const rows = [
    item({
      id: "1",
      filename: "dr-tanya.webp",
      storagePath: "assets/team/dr-tanya.webp",
      title: "Dr Tanya",
      category: "Practitioners",
      altText: "Dr Tanya",
      usage: ["doctors/dr-tanya.html"],
      usageCount: 1,
      byteSize: 120_000,
      createdAt: new Date("2026-11-02T00:00:00.000Z"),
    }),
    item({
      id: "2",
      filename: "unused.webp",
      storagePath: "assets/library/unused.webp",
      title: "Unused promo",
      category: "General",
      altText: "",
      usage: [],
      usageCount: 0,
      byteSize: 900_000,
      createdAt: new Date("2026-11-03T00:00:00.000Z"),
    }),
  ];

  it("filters by search, category, unused, and missing alt", () => {
    assert.equal(filterMediaLibrary(rows, { q: "tanya" }).length, 1);
    assert.equal(filterMediaLibrary(rows, { category: "General" })[0]?.id, "2");
    assert.equal(filterMediaLibrary(rows, { usage: "unused" }).length, 1);
    assert.equal(filterMediaLibrary(rows, { alt: "missing" }).length, 1);
  });

  it("sorts by size and builds dashboard stats", () => {
    const bySize = filterMediaLibrary(rows, { sort: "size" });
    assert.equal(bySize[0]?.id, "2");
    assert.deepEqual(mediaLibraryDashboardStats(rows), {
      total: 2,
      unused: 1,
      largeFiles: 1,
      missingAlt: 1,
      recentUploads: 2,
    });
  });

  it("formats helpers and picker hrefs", () => {
    assert.equal(formatByteSize(1536), "1.5 KB");
    assert.equal(formatDimensions(800, 600), "800 × 600");
    assert.match(
      mediaLibraryPickerHref({ category: "Services", returnTo: "/admin/services/1", field: "service-image" }),
      /category=Services/,
    );
  });
});
