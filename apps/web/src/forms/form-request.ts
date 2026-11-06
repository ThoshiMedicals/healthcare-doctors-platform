import { z } from "zod";
import {
  FORM_REQUEST_TYPES,
  normalizeFormRequestType,
  type FormRequestType,
} from "@/cms/patient-requests";

/** Public form values (legacy labels still accepted). */
export const FORM_TYPES = [
  "New patient registration",
  "Medical records transfer request",
  ...FORM_REQUEST_TYPES,
] as const;

export const DELIVERY_OPTIONS = ["Email", "Collect from reception", "Discuss by phone"] as const;

export const formRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  formType: z.string().trim().min(1).max(120),
  delivery: z.enum(DELIVERY_OPTIONS).optional(),
  privacyConfirm: z.literal(true),
});

export type FormRequestInput = z.infer<typeof formRequestSchema> & { formType: FormRequestType };

export async function parseFormRequest(request: Request): Promise<FormRequestInput> {
  const contentType = request.headers.get("content-type") ?? "";
  let parsed: z.infer<typeof formRequestSchema>;
  if (contentType.includes("application/json")) {
    const body: unknown = await request.json();
    parsed = formRequestSchema.parse(body);
  } else {
    const form = await request.formData();
    const privacy = form.get("privacy_confirm");
    parsed = formRequestSchema.parse({
      name: form.get("name"),
      email: form.get("email") ?? "",
      phone: form.get("phone") ?? "",
      formType: form.get("form_type"),
      delivery: form.get("delivery") || undefined,
      privacyConfirm: privacy === "on" || privacy === "true" || privacy === "1",
    });
  }

  if (!parsed.email && !parsed.phone) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["email"],
        message: "Provide an email address or phone number.",
      },
    ]);
  }

  return {
    ...parsed,
    formType: normalizeFormRequestType(parsed.formType),
  };
}
