/** URL path as requested. "/" is the site root. Other paths keep their suffix, including ".html". */
export function toPublicPath(segments: string[] | undefined): string | null {
  if (!segments || segments.length === 0) return "/";
  if (segments.some((segment) => segment === "" || segment === "." || segment === ".." || segment.includes("\\"))) {
    return null;
  }
  try {
    return segments.map((segment) => decodeURIComponent(segment)).join("/");
  } catch {
    return null;
  }
}

/**
 * Golden-master storage path.
 * The site root file is index.html. / and /index.html both serve that file unchanged.
 */
export function toStoragePath(segments: string[] | undefined): string | null {
  const requestPath = toPublicPath(segments);
  if (requestPath === null) return null;
  if (requestPath === "/" || requestPath === "index.html") return "index.html";
  return requestPath;
}
