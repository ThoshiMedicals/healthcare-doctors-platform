"use client";

import Link from "next/link";
import { useState } from "react";

export function SearchableRecords({
  title,
  intro,
  rows,
  heading = "h1",
}: {
  title: string;
  intro?: string;
  rows: { href: string; title: string; meta: string; search?: string }[];
  heading?: "h1" | "h2";
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? rows.filter((row) => `${row.title} ${row.meta} ${row.search ?? ""}`.toLowerCase().includes(needle))
    : rows;
  const Heading = heading;

  return (
    <section className={heading === "h2" ? "mt-8" : undefined}>
      <Heading className={heading === "h1" ? "text-2xl font-semibold" : "text-lg font-semibold"}>{title}</Heading>
      {intro ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{intro}</p> : null}
      <label className="mt-4 flex max-w-md flex-col gap-1 text-sm text-slate-700">
        Search
        <input
          className="rounded border border-slate-300 bg-white px-3 py-2"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder={`Search ${title.toLowerCase()}`}
        />
      </label>
      <ul className="mt-4 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {rows.length === 0 ? <li className="px-4 py-3 text-sm text-slate-600">No records yet.</li> : null}
        {rows.length > 0 && visible.length === 0 ? <li className="px-4 py-3 text-sm text-slate-600">No matching pages.</li> : null}
        {visible.map((row) => (
          <li key={row.href}>
            <Link href={row.href} className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-slate-50">
              <span className="font-medium">{row.title}</span>
              {row.meta ? <span className="text-slate-500">{row.meta}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
