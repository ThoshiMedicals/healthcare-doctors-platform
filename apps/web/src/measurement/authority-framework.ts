import { promises as fs } from "node:fs";
import path from "node:path";
import { type AuthorityTier, isAuthorityTier } from "@/measurement/authority-tier";

export {
  AUTHORITY_TIERS,
  AUTHORITY_TIER_FRIENDLY,
  AUTHORITY_TIER_SCORE_BAND,
  isAuthorityTier,
} from "@/measurement/authority-tier";
export type { AuthorityTier } from "@/measurement/authority-tier";

export type PractitionerAuthoritySignals = {
  slug: string;
  url: string;
  title: string;
  /** Outbound links from the practitioner profile (related graph). */
  practitioner_links: number;
  /** Knowledge articles that link to this practitioner. */
  inbound_article_links: number;
  /** Distinct related services (outbound profile + inbound service pages). */
  related_services: number;
  authority_score: number;
  tier: AuthorityTier;
};

function slugFromUrl(url: string, prefix: "doctors" | "services" = "doctors"): string {
  return String(url || "")
    .replace(/^\/+/, "")
    .replace(new RegExp(`^${prefix}/`), "")
    .replace(/\.html$/, "");
}

function isArticle(url: string): boolean {
  return String(url || "").includes("/articles/") || String(url || "").startsWith("knowledge/articles/");
}

function isKnowledgeHub(url: string, category?: string): boolean {
  if (category === "Advice" || category === "Knowledge") return true;
  const value = String(url || "");
  return (
    value.startsWith("knowledge/") ||
    value === "health-knowledge-centre.html" ||
    value.includes("knowledge-centre")
  );
}

function isDoctor(url: string, category?: string): boolean {
  if (category === "Doctor") return true;
  return String(url || "").startsWith("doctors/");
}

function isService(url: string, category?: string): boolean {
  if (category === "Service") return true;
  const value = String(url || "");
  return value.startsWith("services/") || value === "services.html";
}

export type ServiceAuthoritySignals = {
  slug: string;
  url: string;
  title: string;
  /** Outbound practitioner links from the service page. */
  related_practitioners: number;
  /** Outbound knowledge / article links from the service page. */
  related_knowledge: number;
  /** Sibling / related service links. */
  related_services: number;
  /** Knowledge articles that link to this service. */
  inbound_article_links: number;
  /** Practitioner profiles that link to this service. */
  inbound_practitioner_links: number;
  authority_score: number;
  tier: AuthorityTier;
};

/**
 * Hub / Developing / Thin for published service pages.
 * Score emphasises inbound articles, practitioner connectivity, and knowledge graph depth.
 */
export function classifyServiceAuthorityTier(signals: {
  related_practitioners: number;
  related_knowledge: number;
  related_services: number;
  inbound_article_links: number;
  inbound_practitioner_links: number;
}): { authority_score: number; tier: AuthorityTier } {
  const authority_score =
    Math.min(Math.max(0, signals.related_practitioners), 15) * 2 +
    Math.min(Math.max(0, signals.related_knowledge), 20) +
    Math.min(Math.max(0, signals.related_services), 10) +
    Math.min(Math.max(0, signals.inbound_article_links), 40) * 1.5 +
    Math.min(Math.max(0, signals.inbound_practitioner_links), 15) * 1.5;

  let tier: AuthorityTier = "Thin";
  if (authority_score >= 40) tier = "Hub";
  else if (authority_score >= 14) tier = "Developing";

  return { authority_score: Number(authority_score.toFixed(1)), tier };
}

/**
 * Hub / Developing / Thin from the published authority graph.
 * Score emphasises inbound article authority and service connectivity.
 */
export function classifyAuthorityTier(signals: {
  practitioner_links: number;
  inbound_article_links: number;
  related_services: number;
}): { authority_score: number; tier: AuthorityTier } {
  const authority_score =
    Math.min(Math.max(0, signals.practitioner_links), 25) +
    Math.min(Math.max(0, signals.inbound_article_links), 50) * 1.5 +
    Math.min(Math.max(0, signals.related_services), 15) * 2;

  let tier: AuthorityTier = "Thin";
  if (authority_score >= 40) tier = "Hub";
  else if (authority_score >= 14) tier = "Developing";

  return { authority_score: Number(authority_score.toFixed(1)), tier };
}

type IndexEntry = {
  title?: string;
  h1?: string;
  url?: string;
  category?: string;
  related?: string[];
};

async function readSearchIndex(): Promise<IndexEntry[]> {
  const indexDir = path.join(process.cwd(), "public", "search-index");
  const manifestPath = path.join(indexDir, "manifest.json");
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as { shards?: string[] };
    const shards = manifest.shards || [];
    const rows: IndexEntry[] = [];
    for (const shard of shards) {
      const data = JSON.parse(await fs.readFile(path.join(indexDir, `${shard}.json`), "utf8")) as IndexEntry[];
      if (Array.isArray(data)) rows.push(...data);
    }
    return rows;
  } catch {
    return [];
  }
}

/** Build Hub / Developing / Thin signals for every published practitioner profile. */
export async function loadPractitionerAuthoritySignals(): Promise<PractitionerAuthoritySignals[]> {
  const rows = await readSearchIndex();
  const byUrl = new Map<string, IndexEntry>();
  for (const row of rows) {
    if (row.url) byUrl.set(row.url, row);
  }

  const doctors = rows.filter(
    (row) => row.category === "Doctor" || String(row.url || "").startsWith("doctors/"),
  );

  const inboundArticles = new Map<string, number>();
  const inboundServices = new Map<string, Set<string>>();

  for (const row of rows) {
    for (const related of row.related || []) {
      if (!String(related).startsWith("doctors/")) continue;
      if (isArticle(String(row.url || ""))) {
        inboundArticles.set(related, (inboundArticles.get(related) || 0) + 1);
      }
      if (isService(String(row.url || ""), row.category)) {
        const set = inboundServices.get(related) || new Set<string>();
        set.add(String(row.url));
        inboundServices.set(related, set);
      }
    }
  }

  return doctors
    .map((doc) => {
      const url = String(doc.url || "");
      const related = doc.related || [];
      const practitioner_links = related.length;
      const outboundServices = new Set(
        related.filter((item) => {
          const target = byUrl.get(item);
          return isService(item, target?.category);
        }),
      );
      for (const serviceUrl of inboundServices.get(url) || []) outboundServices.add(serviceUrl);
      const inbound_article_links = inboundArticles.get(url) || 0;
      const related_services = outboundServices.size;
      const { authority_score, tier } = classifyAuthorityTier({
        practitioner_links,
        inbound_article_links,
        related_services,
      });
      return {
        slug: slugFromUrl(url, "doctors"),
        url,
        title: String(doc.title || doc.h1 || slugFromUrl(url, "doctors")),
        practitioner_links,
        inbound_article_links,
        related_services,
        authority_score,
        tier,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Build Hub / Developing / Thin signals for every published service page. */
export async function loadServiceAuthoritySignals(): Promise<ServiceAuthoritySignals[]> {
  const rows = await readSearchIndex();
  const byUrl = new Map<string, IndexEntry>();
  for (const row of rows) {
    if (row.url) byUrl.set(row.url, row);
  }

  const services = rows.filter((row) => {
    const url = String(row.url || "");
    if (url === "services.html") return false;
    return row.category === "Service" || url.startsWith("services/");
  });

  const inboundArticles = new Map<string, number>();
  const inboundPractitioners = new Map<string, number>();

  for (const row of rows) {
    for (const related of row.related || []) {
      if (!String(related).startsWith("services/") || related === "services.html") continue;
      if (isArticle(String(row.url || ""))) {
        inboundArticles.set(related, (inboundArticles.get(related) || 0) + 1);
      }
      if (isDoctor(String(row.url || ""), row.category)) {
        inboundPractitioners.set(related, (inboundPractitioners.get(related) || 0) + 1);
      }
    }
  }

  return services
    .map((svc) => {
      const url = String(svc.url || "");
      const related = svc.related || [];
      const related_practitioners = related.filter((item) => {
        const target = byUrl.get(item);
        return isDoctor(item, target?.category);
      }).length;
      const related_knowledge = related.filter((item) => {
        const target = byUrl.get(item);
        return isArticle(item) || isKnowledgeHub(item, target?.category);
      }).length;
      const related_services = related.filter((item) => {
        const target = byUrl.get(item);
        return item !== url && isService(item, target?.category) && item !== "services.html";
      }).length;
      const inbound_article_links = inboundArticles.get(url) || 0;
      const inbound_practitioner_links = inboundPractitioners.get(url) || 0;
      const { authority_score, tier } = classifyServiceAuthorityTier({
        related_practitioners,
        related_knowledge,
        related_services,
        inbound_article_links,
        inbound_practitioner_links,
      });
      return {
        slug: slugFromUrl(url, "services"),
        url,
        title: String(svc.title || svc.h1 || slugFromUrl(url, "services")),
        related_practitioners,
        related_knowledge,
        related_services,
        inbound_article_links,
        inbound_practitioner_links,
        authority_score,
        tier,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}
