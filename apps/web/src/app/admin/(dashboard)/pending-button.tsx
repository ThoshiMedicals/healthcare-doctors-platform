"use client";

import { useFormStatus } from "react-dom";

export function PendingButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={`${className} disabled:cursor-wait disabled:opacity-60`} type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
