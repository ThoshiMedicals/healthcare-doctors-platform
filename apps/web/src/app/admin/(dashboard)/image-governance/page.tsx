import { refreshImageGovernance } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { assetKind, displayRecordDate, imageTitle, recordDateStatus } from "@/cms/image-governance";
import { imageRegister, listRegisteredImages } from "@/cms/image-register";
import { publicationLabel } from "@/cms/modules";
import { publicPageName } from "@/cms/staff-labels";
import { SearchableRecords } from "../searchable-list";

export const dynamic = "force-dynamic";

export default async function ImageGovernancePage({
  searchParams,
}: {
  searchParams: Promise<{ synced?: string; sync?: string }>;
}) {
  const query = await searchParams;
  const { clinic } = await requireAction("clinical_signoff");
  let rows = await listRegisteredImages(clinic.id);
  if (rows.length === 0 || query.sync === "1") {
    rows = await imageRegister(clinic.id);
  }

  return (
    <main>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <form action={refreshImageGovernance}>
          <button
            type="submit"
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800"
          >
            Rescan published pages
          </button>
        </form>
      </div>
      {query.synced ? (
        <p className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Usage refreshed from published HTML.
        </p>
      ) : null}
      <SearchableRecords
        title="Image governance"
        intro="Each record follows an image the website already shows. Saving a record keeps the photographer, copyright, dates, and alt text in the CMS. It does not replace the file or change the page layout. A file replacement is offered only for the header logo, the homepage hero, the exterior photograph, and a practitioner portrait. Each replacement must match the current pixel size and file type. Use Rescan when pages have changed."
        rows={rows.map((row) => {
          const expiry = recordDateStatus(row.expiresAt);
          const expiryText =
            expiry === "expired"
              ? `Expired ${displayRecordDate(row.expiresAt)}`
              : row.expiresAt
                ? `Expires ${displayRecordDate(row.expiresAt)}`
                : "No expiry date";
          return {
            href: `/admin/image-governance/${row.id}`,
            title: imageTitle(row.storagePath),
            meta: `${assetKind(row.storagePath)} · ${row.usage.length} ${row.usage.length === 1 ? "page" : "pages"} · ${expiryText}${row.replacementStatus && row.replacementStatus !== "published" ? ` · ${publicationLabel(row.replacementStatus)}` : ""}`,
            search: [
              row.altText,
              row.uploadedBy,
              row.photographer,
              row.copyrightOwner,
              ...row.usage.map(publicPageName),
              row.storagePath,
            ]
              .filter(Boolean)
              .join(" "),
          };
        })}
      />
    </main>
  );
}
