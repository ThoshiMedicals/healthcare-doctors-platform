import { readFile } from "node:fs/promises";
import path from "node:path";
import { publishedRepeats } from "@/cms/repeat-bindings";
import { applyReceptionIndex } from "@/cms/overlay";
import { resolveClinicFromRequest } from "@/clinics/resolve-clinic";
import {
  listImportedPublishedPractitioners,
  mergeImportedPractitionersIntoReceptionIndex,
} from "@/documents/inject-cms-practitioners";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const source = await readFile(path.join(process.cwd(), "public", "digital-reception-index.js"), "utf8");
  const clinic = await resolveClinicFromRequest();
  const repeats = clinic ? await publishedRepeats(clinic.id) : [];
  const imported = clinic ? await listImportedPublishedPractitioners(clinic.id) : [];
  const withImports = mergeImportedPractitionersIntoReceptionIndex(source, imported);
  const body = applyReceptionIndex(withImports, repeats);
  return new Response(body, {
    headers: {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": repeats.length > 0 || imported.length > 0 ? "no-store" : "public, max-age=300",
    },
  });
}
