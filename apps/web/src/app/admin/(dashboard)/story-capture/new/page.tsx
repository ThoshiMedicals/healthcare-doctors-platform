import Link from "next/link";
import { requireAction } from "@/cms/context";
import { CreateStoryForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function NewStoryPage() {
  await requireAction("edit");
  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <Link href="/admin/story-capture" className="text-sm font-medium underline">
        ← Inventory
      </Link>
      <h1 className="text-3xl font-semibold text-slate-900">Invite / create story</h1>
      <p className="text-sm text-slate-600">
        Creates inventory row, consent draft (denied third-party channels), and default-deny reuse
        policies for all placable channels.
      </p>
      <CreateStoryForm />
    </div>
  );
}
