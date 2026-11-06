import { z, ZodError } from "zod";

export const SEARCH_SIGNAL_KINDS = ["search", "result_click"] as const;

export function normalizeSearchTerm(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, 80);
}

export const searchDemandSignalSchema = z.object({
  kind: z.enum(SEARCH_SIGNAL_KINDS).default("search"),
  term: z.string().trim().min(1).max(120),
  intentBucket: z.string().trim().max(64).optional().or(z.literal("")),
  resultType: z.string().trim().max(40).optional().or(z.literal("")),
  resultCount: z.coerce.number().int().min(0).max(500).optional(),
  noResult: z.boolean().optional(),
  clickedResultPath: z.string().trim().max(300).optional().or(z.literal("")),
  clickedStep: z.string().trim().max(40).optional().or(z.literal("")),
  practitionerSlug: z.string().trim().max(120).optional().or(z.literal("")),
  pagePath: z.string().trim().max(300).optional().or(z.literal("")),
  sessionKey: z.string().trim().max(80).optional().or(z.literal("")),
  occurredAt: z.string().datetime().optional(),
});

export type SearchDemandSignalInput = z.infer<typeof searchDemandSignalSchema>;

export async function parseSearchDemandSignal(request: Request): Promise<SearchDemandSignalInput> {
  const contentType = request.headers.get("content-type") ?? "";
  if (
    contentType.includes("application/json") ||
    contentType.includes("text/plain") ||
    contentType.includes("application/octet-stream") ||
    !contentType
  ) {
    const raw = (await request.text()).replace(/^\uFEFF/, "").trim();
    if (!raw) throw new ZodError([]);
    const body: unknown = JSON.parse(raw);
    return searchDemandSignalSchema.parse(body);
  }
  const form = await request.formData();
  return searchDemandSignalSchema.parse({
    kind: form.get("kind") || "search",
    term: form.get("term"),
    intentBucket: form.get("intentBucket") ?? form.get("intent_bucket") ?? "",
    resultType: form.get("resultType") ?? form.get("result_type") ?? "",
    resultCount: form.get("resultCount") ?? form.get("result_count") ?? undefined,
    noResult: form.get("noResult") === "true" || form.get("no_result") === "true",
    clickedResultPath: form.get("clickedResultPath") ?? form.get("clicked_result_path") ?? "",
    clickedStep: form.get("clickedStep") ?? form.get("clicked_step") ?? "",
    practitionerSlug: form.get("practitionerSlug") ?? form.get("practitioner_slug") ?? "",
    pagePath: form.get("pagePath") ?? form.get("page_path") ?? "",
    sessionKey: form.get("sessionKey") ?? form.get("session_key") ?? "",
    occurredAt: form.get("occurredAt") ?? undefined,
  });
}
