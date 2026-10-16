import { applyOverlay, type OverlayInput } from "@/cms/overlay";
import { comparePublishedPages } from "@/cms/publish-check";

/**
 * The public renderer keeps the approved HTML document and overlays published
 * content values. This compiler does not create a new page design.
 */
export function compilePublishedHtml(goldenHtml: string, content: OverlayInput): string {
  return applyOverlay(goldenHtml, content).html;
}

export { comparePublishedPages };
