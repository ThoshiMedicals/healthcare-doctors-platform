import { requireAction } from "@/cms/context";
import { DEMO_PREFERENCE_TOPICS } from "@/engagement-c1/dummy-data";
import { EngagementLabChrome } from "../../lab-chrome";
import { CreateAnnouncementDemoForm } from "./create-form";

export default async function EngagementLabCreateAnnouncementPage() {
  await requireAction("edit");
  return (
    <EngagementLabChrome title="Create announcement (draft preview)">
      <CreateAnnouncementDemoForm topics={[...DEMO_PREFERENCE_TOPICS]} />
    </EngagementLabChrome>
  );
}
