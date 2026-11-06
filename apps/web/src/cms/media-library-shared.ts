export const MEDIA_LIBRARY_CATEGORIES = [
  "Practitioners",
  "Services",
  "Knowledge Hub",
  "Careers",
  "General",
  "Authority Diagrams",
  "Patient Information",
] as const;

export type MediaLibraryCategory = (typeof MEDIA_LIBRARY_CATEGORIES)[number];

export const LARGE_FILE_BYTES = 500_000;
export const RECENT_UPLOAD_DAYS = 7;

export type MediaLibraryListFilters = {
  q?: string;
  category?: MediaLibraryCategory | "all";
  usage?: "all" | "used" | "unused";
  alt?: "all" | "missing";
  sort?: "name" | "uploaded" | "used" | "size" | "usage";
  view?: "grid" | "list";
};

export type MediaLibraryItem = {
  id: string;
  filename: string;
  storagePath: string;
  title: string;
  category: MediaLibraryCategory;
  assetType: string;
  altText: string;
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
  usage: string[];
  usageCount: number;
  byteSize: number | null;
  width: number | null;
  height: number | null;
  replacementStatus: string | null;
  previewUrl: string;
};

export type MediaLibraryDashboardStats = {
  total: number;
  unused: number;
  largeFiles: number;
  missingAlt: number;
  recentUploads: number;
};

export function isMediaLibraryCategory(value: string): value is MediaLibraryCategory {
  return (MEDIA_LIBRARY_CATEGORIES as readonly string[]).includes(value);
}

export function inferMediaCategory(storagePath: string, usage: readonly string[] = []): MediaLibraryCategory {
  const pathLower = storagePath.toLowerCase();
  const usageBlob = usage.join(" ").toLowerCase();

  if (pathLower.includes("/team/") || pathLower.includes("assets/team/")) return "Practitioners";
  if (
    pathLower.includes("/services/") ||
    pathLower.includes("assets/services/") ||
    /services?\//.test(usageBlob) ||
    usageBlob.includes("service")
  ) {
    if (usageBlob.includes("knowledge") || pathLower.includes("knowledge")) return "Knowledge Hub";
    return "Services";
  }
  if (
    pathLower.includes("knowledge") ||
    usageBlob.includes("knowledge-centre") ||
    usageBlob.includes("knowledge/")
  ) {
    return "Knowledge Hub";
  }
  if (
    pathLower.includes("career") ||
    pathLower.includes("join-our-team") ||
    usageBlob.includes("join-our-team") ||
    usageBlob.includes("career")
  ) {
    return "Careers";
  }
  if (
    pathLower.includes("diagram") ||
    pathLower.includes("authority") ||
    pathLower.includes("peer") ||
    usageBlob.includes("authority") ||
    usageBlob.includes("peer")
  ) {
    return "Authority Diagrams";
  }
  if (
    pathLower.includes("patient") ||
    usageBlob.includes("patient-information") ||
    usageBlob.includes("privacy") ||
    usageBlob.includes("forms")
  ) {
    return "Patient Information";
  }
  return "General";
}

export function mediaLibraryPreviewUrl(storagePath: string): string {
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  return `/${storagePath.replace(/^\/+/, "")}`;
}

export function filterMediaLibrary(
  rows: MediaLibraryItem[],
  filters: MediaLibraryListFilters,
): MediaLibraryItem[] {
  const needle = filters.q?.trim().toLowerCase() ?? "";
  let next = rows;
  if (filters.category && filters.category !== "all") {
    next = next.filter((row) => row.category === filters.category);
  }
  if (filters.usage === "unused") next = next.filter((row) => row.usageCount === 0);
  if (filters.usage === "used") next = next.filter((row) => row.usageCount > 0);
  if (filters.alt === "missing") next = next.filter((row) => !row.altText.trim());
  if (needle) {
    next = next.filter((row) =>
      [row.filename, row.title, row.altText, row.category, row.storagePath, ...row.usage]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }
  const sort = filters.sort ?? "name";
  next = [...next].sort((left, right) => {
    switch (sort) {
      case "uploaded":
        return right.createdAt.getTime() - left.createdAt.getTime();
      case "used":
        return (right.lastUsedAt?.getTime() ?? 0) - (left.lastUsedAt?.getTime() ?? 0);
      case "size":
        return (right.byteSize ?? 0) - (left.byteSize ?? 0);
      case "usage":
        return right.usageCount - left.usageCount || left.title.localeCompare(right.title);
      case "name":
      default:
        return left.title.localeCompare(right.title) || left.filename.localeCompare(right.filename);
    }
  });
  return next;
}

export function mediaLibraryDashboardStats(rows: MediaLibraryItem[]): MediaLibraryDashboardStats {
  const recentCut = Date.now() - RECENT_UPLOAD_DAYS * 86_400_000;
  return {
    total: rows.length,
    unused: rows.filter((row) => row.usageCount === 0).length,
    largeFiles: rows.filter((row) => (row.byteSize ?? 0) >= LARGE_FILE_BYTES).length,
    missingAlt: rows.filter((row) => !row.altText.trim()).length,
    recentUploads: rows.filter((row) => row.createdAt.getTime() >= recentCut).length,
  };
}

export function formatByteSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDimensions(width: number | null | undefined, height: number | null | undefined): string {
  if (!width || !height) return "—";
  return `${width} × ${height}`;
}

export function mediaLibraryPickerHref(options: {
  category?: MediaLibraryCategory;
  returnTo?: string;
  field?: string;
}): string {
  const params = new URLSearchParams();
  if (options.category) params.set("category", options.category);
  if (options.returnTo) params.set("returnTo", options.returnTo);
  if (options.field) params.set("field", options.field);
  params.set("view", "grid");
  const query = params.toString();
  return query ? `/admin/media?${query}` : "/admin/media";
}
