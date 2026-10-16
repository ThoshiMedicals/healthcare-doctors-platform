"use client";

import { useState } from "react";
import { publicPageName } from "@/cms/staff-labels";

export function PortraitField({ current, portraits }: { current: string; portraits: string[] }) {
  const [file, setFile] = useState(current);
  const choices = portraits.includes(file) || !file ? portraits : [file, ...portraits];

  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      Photo
      <p className="text-xs leading-5 text-slate-500">
        Updates:
        <span className="block">✓ Profile page</span>
        <span className="block">✓ Team card</span>
        <span className="block">✓ Homepage card</span>
      </p>
      {file ? <img src={`/assets/team/${file}`} alt="" className="h-28 w-28 rounded object-cover" /> : null}
      <select
        className="rounded border border-slate-300 bg-white px-3 py-2"
        name="portraitFile"
        value={file}
        onChange={(event) => setFile(event.target.value)}
      >
        {choices.map((portrait) => (
          <option key={portrait} value={portrait}>
            {publicPageName(portrait)}
          </option>
        ))}
      </select>
    </label>
  );
}
