import { writeAuditLog } from "@/cms/audit";
import { getEnv } from "@/env";

export type PatientRequestNotifyPayload = {
  clinicId: string;
  clinicName: string;
  clinicEmail: string | null;
  requestId: string;
  name: string;
  email: string | null;
  phone: string | null;
  formType: string;
  delivery: string | null;
  adminUrl: string;
};

function notifyRecipient(clinicEmail: string | null): string | null {
  const env = getEnv();
  const configured = env.FORM_REQUEST_NOTIFY_EMAIL?.trim() || "";
  if (configured) return configured;
  return clinicEmail?.trim() || null;
}

async function sendResendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Patient Requests <onboarding@resend.dev>";
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

async function sendWebhook(payload: PatientRequestNotifyPayload, to: string | null): Promise<boolean> {
  const url =
    process.env.FORM_REQUEST_NOTIFY_WEBHOOK_URL?.trim() ||
    process.env.CAREER_APPLICATION_NOTIFY_WEBHOOK_URL?.trim();
  if (!url) return false;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "form_request.created", to, ...payload }),
  });
  return response.ok;
}

export async function notifyPatientRequestCreated(payload: PatientRequestNotifyPayload): Promise<void> {
  const to = notifyRecipient(payload.clinicEmail);
  const subject = `New patient request — ${payload.formType}`;
  const text = [
    `${payload.clinicName} received a patient form request.`,
    "",
    `Name: ${payload.name}`,
    `Email: ${payload.email || "Not provided"}`,
    `Phone: ${payload.phone || "Not provided"}`,
    `Request type: ${payload.formType}`,
    `Delivery: ${payload.delivery || "Not specified"}`,
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
    action: "form_request.notified",
    entityType: "FormRequest",
    entityId: payload.requestId,
    metadata: { to, channel, delivered, formType: payload.formType },
  });
}
