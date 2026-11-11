import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { goldenHtmlRoot, webRoot } from "@/importer/golden-root";

/**
 * Digital Reception R1 — approved runtime exception (Phase 5C dock CLS).
 *
 * Authority: apps/web/public/digital-reception.js is the approved patient-runtime
 * application (SSR launcher reuse, sticky booking-dock CLS protection).
 * old-html/digital-reception.js remains the frozen golden corpus and must not be
 * overwritten to force byte-equality with the approved public runtime.
 *
 * Regression policy:
 * - Do NOT require public/digital-reception.js === old-html/digital-reception.js
 * - DO require checksum integrity of the approved public runtime
 * - DO require functional launcher / 404 / Escape / dock contracts via runtime tests
 */

export const DIGITAL_RECEPTION_APPROVED_RUNTIME_RELATIVE = "digital-reception.js";

export type ApprovedRuntimeException = {
  relativePath: string;
  reason: string;
  authority: "phase_5c_public_runtime";
  goldenByteEqualityRequired: false;
  integrityProtection: "sha256_public_file";
};

export const APPROVED_RUNTIME_EXCEPTIONS: readonly ApprovedRuntimeException[] = [
  {
    relativePath: DIGITAL_RECEPTION_APPROVED_RUNTIME_RELATIVE,
    reason:
      "Phase 5C Digital Reception dock CLS: public runtime reuses SSR launcher, skips 404 dock injection, and preserves booking-dock geometry. Golden old-html copy is historical and must not drive byte-equality regression for this file.",
    authority: "phase_5c_public_runtime",
    goldenByteEqualityRequired: false,
    integrityProtection: "sha256_public_file",
  },
  {
    relativePath: "styles.css",
    reason:
      "Master QA 2026-11-11 presentation/a11y CSS (touch targets, skip-link, offline navy, scroll affordance) lives in apps/web/public/styles.css and is minified at build. Golden old-html/styles.css remains frozen corpus; do not overwrite it to force byte-equality.",
    authority: "phase_5c_public_runtime",
    goldenByteEqualityRequired: false,
    integrityProtection: "sha256_public_file",
  },
] as const;

export function isApprovedRuntimeException(relativePath: string): boolean {
  return APPROVED_RUNTIME_EXCEPTIONS.some((entry) => entry.relativePath === relativePath);
}

export function sha256File(absolutePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
}

export function approvedDigitalReceptionPaths(): { publicFile: string; goldenFile: string } {
  return {
    publicFile: path.join(webRoot(), "public", DIGITAL_RECEPTION_APPROVED_RUNTIME_RELATIVE),
    goldenFile: path.join(goldenHtmlRoot(), DIGITAL_RECEPTION_APPROVED_RUNTIME_RELATIVE),
  };
}

export function digitalReceptionRuntimeIntegrity(): {
  publicSha256: string;
  goldenSha256: string;
  bytesEqual: boolean;
  exceptionDocumented: true;
} {
  const { publicFile, goldenFile } = approvedDigitalReceptionPaths();
  const publicSha256 = sha256File(publicFile);
  const goldenSha256 = sha256File(goldenFile);
  return {
    publicSha256,
    goldenSha256,
    bytesEqual: publicSha256 === goldenSha256,
    exceptionDocumented: true,
  };
}

export function assertDigitalReceptionRuntimeContracts(source: string): string[] {
  const failures: string[] = [];
  // Source contains a RegExp literal like /404\.html$/ — match the escaped form.
  if (!/\/404\\.html\$/.test(source)) {
    failures.push("404 handling: expected pathname 404 early-exit guard");
  }
  if (!/SSR-injected launcher|reuse it so first paint/i.test(source)) {
    failures.push("SSR launcher reuse: expected documented reuse of injected launcher");
  }
  if (!/querySelector\(["']\.digital-reception-launcher["']\)/.test(source)) {
    failures.push("Exactly-one launcher: expected querySelector for .digital-reception-launcher");
  }
  if (!/key===['"]Escape['"]/.test(source)) {
    failures.push("Keyboard: Escape handler missing");
  }
  if (!/trapFocus|focusable\s*=/.test(source)) {
    failures.push("Focus: trap/focusable helpers missing");
  }
  if (!/booking-journey-held/.test(source)) {
    failures.push("Booking dock: booking-journey-held regression marker missing");
  }
  if (!/getElementById\(['"]digital-reception-panel['"]\)/.test(source)) {
    failures.push("Panel: digital-reception-panel lookup missing");
  }
  return failures;
}
