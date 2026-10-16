import { notFound } from "next/navigation";
import { requireUser } from "@/auth/session";
import { getCollection } from "@/cms/collections";
import { countCollection } from "@/cms/counts";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const user = await requireUser();
  const { collection: key } = await params;
  const collection = getCollection(key);
  if (!collection) notFound();

  const count = await countCollection(collection.key, user.id);

  return (
    <main>
      <h1 className="text-2xl font-semibold">{collection.label}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{collection.description}</p>
      <p className="mt-4 text-sm">Records visible to your clinics: {count}</p>
      <h2 className="mt-8 text-lg font-semibold">Fields</h2>
      <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
        {collection.fields.map((field) => (
          <li key={field}>{field}</li>
        ))}
      </ul>
    </main>
  );
}
