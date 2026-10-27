import fs from "fs";
const data = JSON.parse(fs.readFileSync("C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/.tmp-pdf-convert/intent-audit.json", "utf8"));
for (const [intent, rows] of Object.entries(data)) {
  console.log("\n======== " + intent);
  for (const row of rows) {
    console.log("-- " + JSON.stringify(row.query) + " mode=" + row.mode + " direct=" + row.directUrl);
    console.log("   tokens:", row.tokens.join(","));
    console.log("   hints:", row.hints.join(" | ") || "-");
    console.log("   SHOWN:", row.shown.map(s => s.category + " | " + s.title + " | " + s.url).join("\n          "));
    if (row.mode === "direct") {
      console.log("   HIDDEN GUIDES:", row.guides.map(g => g.rank + " " + g.title).join(" || ") || "-");
      console.log("   HIDDEN OTHER:", row.others.map(g => g.rank + " " + g.category + " " + g.title + " " + g.url).join(" || ") || "-");
    } else {
      console.log("   GUIDES:", row.guides.map(g => g.rank + (g.hinted ? "*" : "") + " " + g.title).join(" || ") || "-");
      console.log("   OTHER:", row.others.slice(0, 5).map(g => g.rank + " " + g.category + " " + g.title).join(" || ") || "-");
      console.log("   SERVICE:", row.journeyService ? row.journeyService.title + " " + row.journeyService.url : "-");
    }
  }
}
