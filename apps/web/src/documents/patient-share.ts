/**
 * Phase 3D — share experience orchestrator (Lead).
 * Order: practitioner → services/knowledge → practice info.
 */

import { injectPatientSharePractitioner } from "@/documents/patient-share-practitioner";
import { injectPatientShareServices } from "@/documents/patient-share-services";
import { injectPatientSharePractice } from "@/documents/patient-share-practice";

export function injectPatientShareExperience(html: string, pagePath: string): string {
  let next = injectPatientSharePractitioner(html, pagePath);
  next = injectPatientShareServices(next, pagePath);
  next = injectPatientSharePractice(next, pagePath);
  return next;
}
