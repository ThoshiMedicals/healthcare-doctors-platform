import { z } from "zod";

export const FORM_TYPES = ["New patient registration", "Medical records transfer request"] as const;
export const DELIVERY_OPTIONS = ["Email", "Collect from reception", "Discuss by phone"] as const;

export const formRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  formType: z.enum(FORM_TYPES),
  delivery: z.enum(DELIVERY_OPTIONS).optional(),
  privacyConfirm: z.literal(true),
});

export type FormRequestInput = z.infer<typeof formRequestSchema>;

export async function parseFormRequest(request: Request): Promise<FormRequestInput> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body: unknown = await request.json();
    return formRequestSchema.parse(body);
  }

  const form = await request.formData();
  const privacy = form.get("privacy_confirm");
  return formRequestSchema.parse({
    name: form.get("name"),
    email: form.get("email") ?? "",
    phone: form.get("phone") ?? "",
    formType: form.get("form_type"),
    delivery: form.get("delivery") || undefined,
    privacyConfirm: privacy === "on" || privacy === "true" || privacy === "1",
  });
}
