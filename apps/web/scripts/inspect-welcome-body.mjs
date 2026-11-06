import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const rows = await prisma.page.findMany({
  where: {
    path: {
      in: [
        "updates/welcome-dr-golnar-mortezaei.html",
        "updates/welcome-dr-james-chanaka.html",
        "updates/index.html",
      ],
    },
  },
  include: { publishedRevision: { select: { body: true, createdAt: true } } },
});
for (const r of rows) {
  const body = r.publishedRevision?.body;
  const keys = body && typeof body === "object" && !Array.isArray(body) ? Object.keys(body) : [];
  const source = body && typeof body === "object" && !Array.isArray(body) ? body.source : null;
  console.log(JSON.stringify({ path: r.path, status: r.status, keys, source, createdAt: r.publishedRevision?.createdAt }, null, 2));
}
await prisma.$disconnect();
