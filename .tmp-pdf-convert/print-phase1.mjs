import fs from "fs";
const data = JSON.parse(fs.readFileSync(new URL("./phase1-after.json", import.meta.url), "utf8"));
const want = new Set([
  "book", "booking", "appointment", "book appointment", "see a doctor", "gp visit", "gp appointment",
  "book a skin check", "skin check", "skin checks",
  "book telehealth", "telehealth", "video call", "phone consult", "virtual appointment", "video appointment", "phone appointment",
  "book a vaccination", "vaccination", "vaccine", "vaccines", "jab", "shot", "booster", "immunisation", "needles", "flu shot", "flu vaccine", "travel vaccine", "childhood vaccination",
  "hotdoc message", "hotdoc messages", "hotdoc sms", "hotdoc",
  "new patient", "new patients", "register", "new here", "enrol",
  "bulk billing", "bulk bill", "fees",
  "blood sugar", "hba1c", "glucose", "diabetes",
]);
for (const [intent, rows] of Object.entries(data)) {
  for (const row of rows) {
    if (!want.has(row.query)) continue;
    const first = row.shown[0];
    const second = row.shown[1];
    console.log(
      [
        row.query.padEnd(24),
        row.mode.padEnd(14),
        first ? first.title : "NONE",
        second ? " | " + second.title : "",
        row.journeyService ? " | svc " + row.journeyService.title : "",
      ].join("")
    );
  }
}
