import fs from "fs";
const rows = JSON.parse(fs.readFileSync("C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/search-index/prevention.json","utf8"));
const row = rows.find(r => r.url && r.url.includes("healthy-ageing"));
if (!row) {
  for (const shard of ["prevention","life-stages","conditions","symptoms"]) {
    const all = JSON.parse(fs.readFileSync("C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/search-index/"+shard+".json","utf8"));
    const hit = all.find(r => (r.url||"").includes("healthy-ageing-prevention"));
    if (hit) {
      console.log(hit.url);
      console.log((hit.related||[]).filter(u => u.startsWith("services/") || u.startsWith("doctors/")).join("\n"));
    }
  }
} else {
  console.log(row.url);
  console.log((row.related||[]).filter(u => u.startsWith("services/") || u.startsWith("doctors/")).join("\n"));
}
