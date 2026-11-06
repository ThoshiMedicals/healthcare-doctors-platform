import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const pages = await prisma.page.findMany({
  where: {
    path: { in: ["updates/welcome-dr-golnar-mortezaei.html", "updates/welcome-dr-james-chanaka.html"] },
  },
  include: {
    practiceUpdate: true,
    publishedRevision: { select: { html: true } },
  },
});
for (const page of pages) {
  console.log("\nPATH", page.path);
  console.log("practiceUpdate", JSON.stringify(page.practiceUpdate, null, 2)?.slice(0, 1500));
  const html = page.publishedRevision?.html || "";
  console.log("html has doctor link", /doctors\//.test(html));
  console.log("h1", (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]?.replace(/<[^>]+>/g, ""));
  console.log("lede", (html.match(/class="lede"[^>]*>([\s\S]*?)<\/p>/i) || [])[1]?.replace(/<[^>]+>/g, "").slice(0, 200));
  const img = (html.match(/<img[^>]+src="([^"]+)"/i) || [])[1];
  console.log("firstImg", img);
}
await prisma.$disconnect();
