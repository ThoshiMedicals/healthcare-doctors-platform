export function formatCount(value: number): string {
  return value.toLocaleString("en-AU");
}

export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}%`;
}

export function formatDashboardLabel(key: string): string {
  return key
    .replace(/^doctors\//, "")
    .replace(/^services\//, "")
    .replace(/^knowledge\/articles\//, "")
    .replace(/\.html$/, "")
    .replace(/^dr-/, "Dr ")
    .replace(/^mr-/, "Mr ")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
