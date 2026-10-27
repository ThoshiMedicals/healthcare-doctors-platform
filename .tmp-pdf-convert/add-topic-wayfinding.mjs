import fs from "fs";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";

const pages = [
  {
    file: "knowledge/skin-health-skin-cancer.html",
    links: [["Want to book a skin check?", "../services/skin-checks.html"]],
  },
  {
    file: "services/skin-checks.html",
    links: [["Read about skin checks.", "../knowledge/skin-health-skin-cancer.html"]],
  },
  {
    file: "knowledge/articles/when-should-i-book-a-skin-check.html",
    links: [["Want to book a skin check?", "../../services/skin-checks.html"]],
  },
  {
    file: "knowledge/telehealth-access-to-care.html",
    links: [["Need telehealth?", "../telehealth.html"]],
  },
  {
    file: "services/telehealth.html",
    links: [
      ["Book a telehealth consultation.", "../telehealth.html"],
      ["Read about telehealth.", "../knowledge/telehealth-access-to-care.html"],
    ],
  },
  {
    file: "telehealth.html",
    links: [["Read about telehealth.", "knowledge/telehealth-access-to-care.html"]],
  },
  {
    file: "knowledge/vaccinations.html",
    links: [["Want to book a vaccination?", "../services/vaccinations.html"]],
  },
  {
    file: "services/vaccinations.html",
    links: [["Read about vaccinations.", "../knowledge/vaccinations.html"]],
  },
  {
    file: "knowledge/articles/childhood-vaccinations-explained.html",
    links: [["Want to book a vaccination?", "../../services/vaccinations.html"]],
  },
  {
    file: "knowledge/diabetes.html",
    links: [["Need ongoing diabetes care?", "../services/chronic-disease-care.html"]],
  },
  {
    file: "knowledge/chronic-disease-management.html",
    links: [["Need chronic disease care?", "../services/chronic-disease-care.html"]],
  },
  {
    file: "services/chronic-disease-care.html",
    links: [
      ["Read about diabetes.", "../knowledge/diabetes.html"],
      ["Read about chronic disease care.", "../knowledge/chronic-disease-management.html"],
    ],
  },
];

function markup(links) {
  const anchors = links
    .map(([label, href]) => `<a href="${href}">${label}</a>`)
    .join("");
  return `<nav class="topic-wayfinding" aria-label="Related topic"><div class="shell">${anchors}</div></nav>`;
}

for (const page of pages) {
  const full = `${root}/${page.file}`;
  const text = fs.readFileSync(full, "utf8");
  if (text.includes('class="topic-wayfinding"')) {
    console.log("skip " + page.file);
    continue;
  }
  const marker = '<div class="breadcrumb-bar">';
  const at = text.indexOf(marker);
  if (at < 0) throw new Error("No breadcrumb on " + page.file);
  const next = text.slice(0, at) + markup(page.links) + text.slice(at);
  fs.writeFileSync(full, next);
  console.log("updated " + page.file);
}
