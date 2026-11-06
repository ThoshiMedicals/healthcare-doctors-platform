"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatByteSize,
  formatDimensions,
  type MediaLibraryItem,
} from "@/cms/media-library-shared";
import { displayRecordDate } from "@/cms/image-governance";
import { publicPageName } from "@/cms/staff-labels";

type SerializableItem = Omit<MediaLibraryItem, "createdAt" | "updatedAt" | "lastUsedAt"> & {
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
};

export function MediaLibraryView({
  rows,
  initialView,
}: {
  rows: SerializableItem[];
  initialView: "grid" | "list";
}) {
  const [view, setView] = useState<"grid" | "list">(initialView);
  const items = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt) : null,
      })),
    [rows],
  );

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-sm text-slate-600">{items.length} assets</p>
        <div className="ml-auto flex rounded border border-slate-300 bg-white text-sm">
          <button
            type="button"
            className={`px-3 py-1.5 ${view === "grid" ? "bg-slate-900 text-white" : "text-slate-700"}`}
            onClick={() => setView("grid")}
          >
            Grid
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 ${view === "list" ? "bg-slate-900 text-white" : "text-slate-700"}`}
            onClick={() => setView("list")}
          >
            List
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">No matching media.</p>
      ) : null}

      {view === "grid" && items.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/media/${row.id}`}
                className="flex h-full flex-col overflow-hidden rounded border border-slate-200 bg-white hover:border-slate-400"
              >
                <div className="flex h-36 items-center justify-center bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.previewUrl} alt="" className="max-h-36 max-w-full object-contain" />
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="line-clamp-2 text-sm font-medium text-slate-900">{row.title}</p>
                  <p className="truncate text-xs text-slate-500">{row.filename}</p>
                  <p className="text-xs text-slate-500">
                    {row.category} · {row.usageCount} used · {formatDimensions(row.width, row.height)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {view === "list" && items.length > 0 ? (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Title / file</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Dimensions</th>
                <th className="px-3 py-2 font-semibold">Uploaded</th>
                <th className="px-3 py-2 font-semibold">Last used</th>
                <th className="px-3 py-2 font-semibold">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/admin/media/${row.id}`} className="font-medium text-slate-900 underline-offset-2 hover:underline">
                      {row.title}
                    </Link>
                    <p className="text-xs text-slate-500">{row.filename}</p>
                    <p className="text-xs text-slate-500">{row.category}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{row.assetType}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {formatDimensions(row.width, row.height)}
                    <p className="text-xs text-slate-500">{formatByteSize(row.byteSize)}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{displayRecordDate(row.createdAt) || "—"}</td>
                  <td className="px-3 py-2 text-slate-600">{displayRecordDate(row.lastUsedAt) || "—"}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.usageCount}
                    {row.usage[0] ? (
                      <p className="max-w-[12rem] truncate text-xs text-slate-500">{publicPageName(row.usage[0])}</p>
                    ) : (
                      <p className="text-xs text-amber-700">Unused</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
