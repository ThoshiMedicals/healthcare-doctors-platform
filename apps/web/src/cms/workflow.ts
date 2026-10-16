import type { PublicationStatus } from "@prisma/client";

/**
 * Status machine from the approved publishing workflow.
 * A calendar row alone cannot publish a page.
 */
export const STATUS_TRANSITIONS: Record<PublicationStatus, readonly PublicationStatus[]> = {
  planned: ["assigned", "on_hold"],
  assigned: ["drafting", "on_hold"],
  drafting: ["clinical_review", "on_hold"],
  clinical_review: ["approved", "drafting", "on_hold"],
  approved: ["scheduled", "published", "drafting", "on_hold"],
  scheduled: ["published", "drafting", "on_hold"],
  published: ["review_due", "drafting"],
  review_due: ["drafting", "on_hold"],
  on_hold: ["planned", "assigned", "drafting"],
};

export function canTransition(from: PublicationStatus, to: PublicationStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(from: PublicationStatus, to: PublicationStatus) {
    super(`Cannot move content from ${from} to ${to}.`);
    this.name = "InvalidTransitionError";
  }
}

export function assertTransition(from: PublicationStatus, to: PublicationStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}
