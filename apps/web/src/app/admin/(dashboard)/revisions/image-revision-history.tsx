import { rollbackRevision } from "@/cms/actions";
import { imageRestoreLabel, imageRevisionPlaces, imageVersionResult, type ImageRevisionPlace } from "@/cms/image-revision-view";
import { revisionChanges } from "@/cms/revision-summary";
import { brisbaneTime } from "@/cms/staff-labels";
import { PendingButton } from "../pending-button";

const PLACE_LABEL: Record<ImageRevisionPlace, string> = {
  current: "Current version",
  previous: "Previous version",
  same: "Same as current",
  older: "Older version",
};

const PLACE_CLASS: Record<ImageRevisionPlace, string> = {
  current: "border-2 border-slate-900",
  previous: "border-2 border-slate-500",
  same: "border border-slate-200",
  older: "border border-slate-200",
};

export function ImageRevisionHistory({
  revisions,
  current,
  canRollback,
}: {
  revisions: {
    id: string;
    createdAt: Date;
    previous: unknown;
    next: unknown;
    author: { username: string | null; name: string | null } | null;
  }[];
  current: unknown;
  canRollback: boolean;
}) {
  const places = imageRevisionPlaces(current, revisions);
  const hasCurrent = places.includes("current");

  return (
    <div className="mt-6">
      {hasCurrent ? null : (
        <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          No saved version matches this image record exactly. A version can still use the same published file.
          Choosing it also restores that version’s workflow and proposal.
        </p>
      )}
      <ol className="space-y-4">
        {revisions.length === 0 ? <li className="text-sm text-slate-600">No versions yet.</li> : null}
        {revisions.map((revision, index) => {
          const place = places[index] ?? "older";
          const label = imageRestoreLabel(place);
          const result = imageVersionResult(revision.next, current);
          const fileMatches = result.some((line) => line === "Published file: same as the website now");
          const author = revision.author?.name || revision.author?.username || "Unknown user";
          return (
            <li key={revision.id} className={`rounded bg-white p-4 text-sm ${PLACE_CLASS[place]}`}>
              <p className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    place === "current"
                      ? "bg-slate-900 text-white"
                      : place === "previous"
                        ? "border border-slate-900 text-slate-900"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {PLACE_LABEL[place]}
                </span>
                <span className="text-slate-500">Saved {brisbaneTime(revision.createdAt)} Brisbane by {author}</span>
              </p>
              <div className="mt-3">
                <p className="font-medium">{place === "current" ? "Active on the website" : "Choosing this version makes this active"}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-800">
                  {result.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                {fileMatches && place !== "current" && place !== "same" ? (
                  <p className="mt-2 text-slate-700">
                    The published file matches the website. This is not the current record, because the workflow or
                    proposal differs. Choosing it restores those as well.
                  </p>
                ) : null}
              </div>
              <div className="mt-3 text-slate-600">
                <p className="font-medium text-slate-700">What changed in this save</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {revisionChanges(revision.previous, revision.next).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              {canRollback && label ? (
                <form action={rollbackRevision} className="mt-4 grid gap-2">
                  <input type="hidden" name="revisionId" value={revision.id} />
                  <label className="flex items-start gap-2 text-slate-700">
                    <input className="mt-1" name="confirmRestore" type="checkbox" required />
                    <span>Replace the current image with this version. The filename and page layout stay the same.</span>
                  </label>
                  <PendingButton
                    label={label}
                    pendingLabel="Restoring…"
                    className={
                      place === "previous"
                        ? "w-fit rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                        : "w-fit rounded border border-slate-300 px-3 py-2 text-sm"
                    }
                  />
                </form>
              ) : null}
              {canRollback && !label ? (
                <p className="mt-4 text-slate-600">No restore button. This version is already the current image.</p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
