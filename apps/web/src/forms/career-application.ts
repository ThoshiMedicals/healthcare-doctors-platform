import { z } from "zod";

export const careerApplicationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  roleInterest: z.string().trim().min(1).max(120),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  vacancyId: z.string().trim().max(64).optional().or(z.literal("")),
  privacyConfirm: z.literal(true),
});

export type CareerApplicationInput = z.infer<typeof careerApplicationSchema>;

export async function parseCareerApplicationForm(request: Request): Promise<{
  input: CareerApplicationInput;
  resume: File | null;
}> {
  const form = await request.formData();
  const privacy = form.get("privacy_confirm");
  const input = careerApplicationSchema.parse({
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone") ?? "",
    roleInterest: form.get("role") ?? form.get("roleInterest") ?? "",
    message: form.get("message") ?? "",
    vacancyId: form.get("vacancyId") ?? "",
    privacyConfirm: privacy === "on" || privacy === "true" || privacy === "1",
  });
  const resumeValue = form.get("resume");
  const resume = resumeValue instanceof File && resumeValue.size > 0 ? resumeValue : null;
  return { input, resume };
}
