import { requireAction } from "@/cms/context";
import { assetKind, displayRecordDate, imageTitle, recordDateStatus } from "@/cms/image-governance";
import { publicationLabel } from "@/cms/modules";
import { imageRegister } from "@/cms/image-register";
import { publicPageName } from "@/cms/staff-labels";
import { SearchableRecords } from "../searchable-list";

export const dynamic = "force-dynamic";

export default async function ImageGovernancePage() {
  const { clinic } = await requireAction("clinical_signoff");
  const rows = await imageRegister(clinic.id);

  return (
    <main>
      <SearchableRecords
        title="Image governance"
        intro="Each record follows an image the website already shows. Saving a record keeps the photographer, copyright, dates, and alt text in the CMS. It does not replace the file or change the page layout."
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
            search: [row.altText, row.uploadedBy, row.photographer, row.copyrightOwner, ...row.usage.map(publicPageName), row.storagePath]
              .filter(Boolean)
              .join(" "),
          };
        })}
      />
    </main>
  );
}
