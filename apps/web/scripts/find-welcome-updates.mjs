import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const pages = await prisma.page.findMany({
    where: {
      OR: [
        { path: { contains: "golnar" } },
        { path: { contains: "james" } },
        { path: { contains: "yamesha" } },
        { path: { contains: "welcome" } },
        { title: { contains: "Golnar", mode: "insensitive" } },
        { title: { contains: "James", mode: "insensitive" } },
        { title: { contains: "Yamesha", mode: "insensitive" } },
        { title: { contains: "welcome", mode: "insensitive" } },
      ],
    },
    select: { path: true, title: true, status: true, clinicId: true },
    take: 50,
  });
  console.log("pages", JSON.stringify(pages, null, 2));

  const updates = await prisma.page.findMany({
    where: { path: { startsWith: "updates/" } },
    select: { path: true, title: true, status: true },
    orderBy: { path: "asc" },
  });
  console.log("all updates", updates.length, JSON.stringify(updates, null, 2));

  const practitioners = await prisma.practitioner.findMany({
    where: {
      OR: [
        { slug: { contains: "golnar" } },
        { slug: { contains: "james" } },
        { slug: { contains: "yamesha" } },
      ],
    },
    select: {
      slug: true,
      name: true,
      status: true,
      areasOfCare: true,
      bookingUrl: true,
      page: { select: { path: true, status: true } },
    },
  });
  console.log("practitioners", JSON.stringify(practitioners, null, 2));
} finally {
  await prisma.$disconnect();
}
