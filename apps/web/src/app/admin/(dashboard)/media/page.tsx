import Link from "next/link";
import { requireAction } from "@/cms/context";
import { uploadMedia } from "@/cms/actions";
import {
  MEDIA_LIBRARY_CATEGORIES,
  filterMediaLibrary,
  isMediaLibraryCategory,
  mediaLibraryDashboardStats,
  syncMediaLibrary,
  type MediaLibraryListFilters,
} from "@/cms/media-library";
import { GateNotice } from "../ui";
import { MediaLibraryView } from "./media-library-view";
import { MediaLibraryWidgets } from "./media-widgets";

export const dynamic = "force-dynamic";

function parseFilters(query: Record<string, string | undefined>): MediaLibraryListFilters {
  const categoryRaw = query.category?.trim() || "all";
  const usageRaw = query.usage?.trim() || "all";
  const altRaw = query.alt?.trim() || "all";
  const sortRaw = query.sort?.trim() || "name";
  const viewRaw = query.view?.trim() || "grid";
  return {
    q: query.q?.trim() || undefined,
    category: categoryRaw === "all" || !categoryRaw ? "all" : isMediaLibraryCategory(categoryRaw) ? categoryRaw : "all",
    usage: usageRaw === "used" || usageRaw === "unused" ? usageRaw : "all",
    alt: altRaw === "missing" ? "missing" : "all",
    sort:
      sortRaw === "uploaded" || sortRaw === "used" || sortRaw === "size" || sortRaw === "usage" ? sortRaw : "name",
    view: viewRaw === "list" ? "list" : "grid",
  };
}

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    usage?: string;
    alt?: string;
    sort?: string;
    view?: string;
    returnTo?: string;
    field?: string;
    error?: string;
    reason?: string;
  }>;
}) {
  const query = await searchParams;
  const { clinic } = await requireAction("edit");
  const filters = parseFilters(query);
  const catalog = await syncMediaLibrary(clinic.id);
  const stats = mediaLibraryDashboardStats(catalog);
  const rows = filterMediaLibrary(catalog, filters);

  return (
    <main>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Content</p>
          <h1 className="text-2xl font-semibold">Media Library</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Browse clinic images, see where they are used, and open replacement or governance workflows. Public page
            layouts stay locked — this is an operations catalogue, not a redesign surface.
          </p>
        </div>
        <Link
          href="/admin/image-governance"
          className="text-sm font-medium text-slate-800 underline underline-offset-2"
        >
          Image reviews →
        </Link>
      </div>

      <GateNotice error={query.error} reason={query.reason} />

      {query.returnTo ? (
        <p className="mb-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Selecting media for an editor. Open an asset, then return to{" "}
          <Link href={query.returnTo} className="underline">
            the previous form
          </Link>
          {query.field ? ` (${query.field})` : ""}.
        </p>
      ) : null}

      <MediaLibraryWidgets stats={stats} />

      <form
        action={uploadMedia}
        encType="multipart/form-data"
        className="mt-6 grid gap-3 rounded border border-dashed border-slate-300 bg-white p-4 md:grid-cols-4"
      >
        <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
          Upload to library
          <input className="rounded border border-slate-300 px-3 py-2" name="file" type="file" accept="image/webp,image/png,image/jpeg,image/gif,image/avif" required />
          <span className="text-xs text-slate-500">
            Stores under assets/library/. Does not change published pages until an editor places the file.
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Category
          <select className="rounded border border-slate-300 px-3 py-2" name="category" defaultValue="General">
            {MEDIA_LIBRARY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Alt text
          <input className="rounded border border-slate-300 px-3 py-2" name="altText" type="text" />
        </label>
        <div className="flex items-end md:col-span-4">
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Upload
          </button>
        </div>
      </form>

      <form className="mt-6 grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-6" method="get">
        {query.returnTo ? <input type="hidden" name="returnTo" value={query.returnTo} /> : null}
        {query.field ? <input type="hidden" name="field" value={query.field} /> : null}
        <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
          Search
          <input
            className="rounded border border-slate-300 px-3 py-2"
            name="q"
            type="search"
            defaultValue={filters.q ?? ""}
            placeholder="Filename, title, alt, page…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Category
          <select
            className="rounded border border-slate-300 px-3 py-2"
            name="category"
            defaultValue={filters.category ?? "all"}
          >
            <option value="all">All categories</option>
            {MEDIA_LIBRARY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Usage
          <select className="rounded border border-slate-300 px-3 py-2" name="usage" defaultValue={filters.usage ?? "all"}>
            <option value="all">All assets</option>
            <option value="used">Used on site</option>
            <option value="unused">Unused assets</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Alt text
          <select className="rounded border border-slate-300 px-3 py-2" name="alt" defaultValue={filters.alt ?? "all"}>
            <option value="all">Any</option>
            <option value="missing">Missing alt</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Sort
          <select className="rounded border border-slate-300 px-3 py-2" name="sort" defaultValue={filters.sort ?? "name"}>
            <option value="name">Name</option>
            <option value="uploaded">Upload date</option>
            <option value="used">Last used</option>
            <option value="size">File size</option>
            <option value="usage">Usage count</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Default view
          <select className="rounded border border-slate-300 px-3 py-2" name="view" defaultValue={filters.view ?? "grid"}>
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </label>
        <div className="flex items-end md:col-span-6">
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Apply filters
          </button>
        </div>
      </form>

      <MediaLibraryView
        initialView={filters.view ?? "grid"}
        rows={rows.map((row) => ({
          ...row,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
        }))}
      />
    </main>
  );
}
