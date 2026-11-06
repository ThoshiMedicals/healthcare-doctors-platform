"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { publicPageName } from "@/cms/staff-labels";

export type MediaPickerOption = {
  id: string;
  filename: string;
  title: string;
  previewUrl: string;
  storagePath: string;
};

/** Compact selector for content editors — choose an existing library asset. */
export function MediaLibraryPicker({
  name,
  label,
  current,
  options,
  libraryHref,
  help,
}: {
  name: string;
  label: string;
  current: string;
  options: MediaPickerOption[];
  libraryHref: string;
  help?: string;
}) {
  const [value, setValue] = useState(current);
  const selected = useMemo(
    () => options.find((item) => item.filename === value || item.storagePath.endsWith(`/${value}`) || item.storagePath === value),
    [options, value],
  );
  const choices = options.some((item) => item.filename === value) || !value ? options : [{ id: "current", filename: value, title: value, previewUrl: "", storagePath: value }, ...options];

  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      {label}
      {help ? <p className="text-xs leading-5 text-slate-500">{help}</p> : null}
      {selected?.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={selected.previewUrl} alt="" className="h-28 w-28 rounded object-cover" />
      ) : null}
      <select
        className="rounded border border-slate-300 bg-white px-3 py-2"
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {choices.map((item) => (
          <option key={item.id} value={item.filename}>
            {item.title || publicPageName(item.filename)}
          </option>
        ))}
      </select>
      <Link href={libraryHref} className="text-xs font-medium text-slate-700 underline underline-offset-2">
        Browse Media Library
      </Link>
    </label>
  );
}
