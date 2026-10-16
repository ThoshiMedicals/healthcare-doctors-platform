import { createHash } from "node:crypto";

/** Binds a review to an exact content payload. Private evidence is not included. */
export function fingerprintContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
