import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
try {
  const pages = await p.page.findMany({
    where: { path: { contains: "ranawake" } },
    select: { id: true, path: true, status: true, title: true, clinicId: true },
  });
  const practitioners = await p.practitioner.findMany({
    where: {
      OR: [{ name: { contains: "Ranawake" } }, { name: { contains: "Gemunu" } }],
    },
    select: { id: true, name: true, status: true, pageId: true },
  });
  console.log(JSON.stringify({ pages, practitioners }, null, 2));
} finally {
  await p.$disconnect();
}
