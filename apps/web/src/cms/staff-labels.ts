const SMALL = new Set(["a", "and", "for", "in", "of", "the", "to"]);

const WORDS: Record<string, string> = {
  agpal: "AGPAL",
  faq: "FAQ",
  faqs: "FAQs",
  ecg: "ECG",
  iud: "IUD",
  gp: "GP",
  adhd: "ADHD",
  dr: "Dr",
};

export function plainText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

export function publicPageName(path: string): string {
  const file = path.split(/[/\\]/).pop()?.replace(/\.(html|webp)$/i, "") ?? path;
  if (!file || file === "index") return "Home";
  return file
    .split("-")
    .filter(Boolean)
    .map((word, index) => {
      const known = WORDS[word.toLowerCase()];
      if (known) return known;
      if (index > 0 && SMALL.has(word.toLowerCase())) return word.toLowerCase();
      return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    })
    .join(" ");
}

export function listPageName(title: string, path: string | null | undefined): string {
  const decoded = plainText(title).replace(/\s*\|\s*Woolloongabba Medical Centre\s*$/i, "").trim();
  const fromPath = path ? publicPageName(path) : "";
  if (!decoded) return fromPath;
  if (decoded.includes(".html") || decoded.length > 60 || /[.!?]$/.test(decoded)) return fromPath || decoded;
  return decoded;
}

export function publicHref(path: string | null | undefined): string | null {
  if (!path) return null;
  const clean = path.replace(/^\.\//, "");
  if (clean === "index.html" || clean === "/") return "/";
  return clean.startsWith("/") ? clean : `/${clean}`;
}

export function brisbaneTime(value: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}
