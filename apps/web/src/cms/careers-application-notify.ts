import { writeAuditLog } from "@/cms/audit";
import { getEnv } from "@/env";

export type CareerApplicationNotifyPayload = {
  clinicId: string;
  clinicName: string;
  clinicEmail: string | null;
  applicationId: string;
  name: string;
  email: string;
  phone: string;
  roleInterest: string;
  vacancyTitle: string | null;
  hasResume: boolean;
  adminUrl: string;
};

function notifyRecipient(clinicEmail: string | null): string | null {
  const env = getEnv();
  const configured =
    env.CAREER_APPLICATION_NOTIFY_EMAIL?.trim() ||
    env.FORM_REQUEST_NOTIFY_EMAIL?.trim() ||
    "";
  if (configured) return configured;
  return clinicEmail?.trim() || null;
}

async function sendResendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Careers <onboarding@resend.dev>";
  if (!apiKey) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  return response.ok;
}

async function sendWebhook(payload: CareerApplicationNotifyPayload, to: string | null): Promise<boolean> {
  const url = process.env.CAREER_APPLICATION_NOTIFY_WEBHOOK_URL?.trim();
  if (!url) return false;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "career_application.created", to, ...payload }),
  });
  return response.ok;
}

/** Notify the practice of a new talent EOI. Always audits; email/webhook when configured. */
export async function notifyCareerApplicationCreated(payload: CareerApplicationNotifyPayload): Promise<void> {
  const to = notifyRecipient(payload.clinicEmail);
  const subject = `New careers expression of interest — ${payload.roleInterest}`;
  const text = [
    `${payload.clinicName} received a talent community expression of interest.`,
    "",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone || "Not provided"}`,
    `Role interest: ${payload.roleInterest}`,
    `Vacancy: ${payload.vacancyTitle || "Talent community (no specific vacancy)"}`,
    `Resume attached: ${payload.hasResume ? "Yes" : "No"}`,
    "",
    `Review in admin: ${payload.adminUrl}`,
  ].join("\n");

  let channel: "resend" | "webhook" | "audit_only" = "audit_only";
  let delivered = false;

  if (to) {
    try {
      delivered = await sendResendEmail(to, subject, text);
      if (delivered) channel = "resend";
    } catch {
      delivered = false;
    }
  }

  if (!delivered) {
    try {
      delivered = await sendWebhook(payload, to);
      if (delivered) channel = "webhook";
    } catch {
      delivered = false;
    }
  }

  await writeAuditLog({
    clinicId: payload.clinicId,
    action: "career_application.notified",
    entityType: "CareerApplication",
    entityId: payload.applicationId,
    metadata: {
      to,
      channel,
      delivered,
      roleInterest: payload.roleInterest,
      hasResume: payload.hasResume,
    },
  });
}
