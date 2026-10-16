import { requireAction } from "@/cms/context";
import { publicationLabel } from "@/cms/modules";
import { plainText } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";
import { SearchableRecords } from "../searchable-list";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const { clinic } = await requireAction("edit");
  const [topics, articles] = await Promise.all([
    prisma.knowledgeTopic.findMany({
      where: { clinicId: clinic.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true, status: true },
    }),
    prisma.knowledgeArticle.findMany({
      where: { clinicId: clinic.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true, status: true },
    }),
  ]);

  return (
    <main>
      <h1 className="text-2xl font-semibold">Knowledge Centre</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Topics and articles. Workflow is Draft, Under Review, Approved, and Published.
        Article URLs stay on the imported paths.
      </p>
      <SearchableRecords
        heading="h2"
        title="Topics"
        rows={topics.map((topic) => ({
          href: `/admin/knowledge/topics/${topic.id}`,
          title: plainText(topic.title),
          meta: publicationLabel(topic.status),
        }))}
      />
      <SearchableRecords
        heading="h2"
        title="Articles"
        rows={articles.map((article) => ({
          href: `/admin/knowledge/${article.id}`,
          title: plainText(article.title),
          meta: publicationLabel(article.status),
        }))}
      />
    </main>
  );
}
