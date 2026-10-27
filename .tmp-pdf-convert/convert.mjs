import { pdf } from "pdf-to-img";
import fs from "fs";
import path from "path";

const jobs = [
  {
    pdf: "C:/Users/RoshanSamarawickrema/Downloads/to identify scam message from hotdoc generated message for us.pdf",
    out: "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/assets/patient-information/hotdoc-scam-identification-poster.png",
  },
  {
    pdf: "C:/Users/RoshanSamarawickrema/Downloads/Bulk billing requirment to get AOB form signed A3.pdf",
    out: "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/assets/patient-information/hotdoc-aob-bulk-billing-consent-a3.png",
  },
];

for (const job of jobs) {
  const document = await pdf(job.pdf, { scale: 2 });
  let pageNo = 0;
  for await (const image of document) {
    pageNo += 1;
    const target = pageNo === 1 ? job.out : job.out.replace(/\.png$/, `-p${pageNo}.png`);
    fs.writeFileSync(target, image);
    console.log("wrote", target, image.length);
  }
}
