import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const c = await p.clinic.findFirst({ where: { slug: "woolloongabba" } });
const id = c.id;

const enq = await p.gpEnquiry.count({ where: { clinicId: id } });
const enqBy = await p.gpEnquiry.groupBy({ by: ["status"], where: { clinicId: id }, _count: true });
const onboard = await p.gpOnboardingCase.count({ where: { clinicId: id } });
const first90 = await p.gpFirst90SettlingCase.count({ where: { clinicId: id } });
const attrEv = await p.gpAttractionEvent.count({ where: { clinicId: id } });
const apps = await p.careerApplication.count({ where: { clinicId: id } });
const forms = await p.formRequest.count({ where: { clinicId: id } });
const ready = await p.gpReadinessPackage.findMany({
  where: { clinicId: id },
  select: { id: true, status: true, updatedAt: true },
});
const drafts = await p.gpDoctorProfileDraft.groupBy({
  by: ["status"],
  where: { clinicId: id },
  _count: true,
});
const stories = await p.gpStory.count({ where: { clinicId: id } });
const settling = await p.gpFirst90SettlingCase.findMany({
  where: { clinicId: id },
  select: { id: true, status: true },
  take: 10,
});

console.log(
  JSON.stringify(
    { enq, enqBy, onboard, first90, attrEv, apps, forms, ready, drafts, stories, settling },
    null,
    2,
  ),
);
await p.$disconnect();
