import fs from "fs";

const html = fs.readFileSync("old-html/doctors/dr-gemunu-suresh-ranawake.html", "utf8");
const strip = (s) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
const about = (html.match(/About Dr Gemunu[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1];
const qualsBlock = (html.match(/id="qualifications"[\s\S]{0,800}/i) || [])[0] || "";
const langsBlock = (html.match(/id="languages"[\s\S]{0,500}/i) || [])[0] || "";
const helpUl = (html.match(/How Dr Gemunu[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i) || [])[1] || "";
const intUl =
  (html.match(/id="professional-interests"[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i) || [])[1] || "";
const lis = (u) => [...u.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => strip(m[1]));
const oho = (html.match(/Office of the Health Ombudsman[\s\S]{0,500}/i) || [])[0] || "";

console.log(
  JSON.stringify(
    {
      name: strip(h1 || ""),
      about: strip(about || ""),
      qualifications: strip((qualsBlock.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || ""),
      languages: strip((langsBlock.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || ""),
      helping: lis(helpUl),
      interests: lis(intUl),
      bookingNotice: strip(oho).slice(0, 450),
      url: "http://127.0.0.1:3100/doctors/dr-gemunu-suresh-ranawake.html",
      file: "old-html/doctors/dr-gemunu-suresh-ranawake.html",
    },
    null,
    2,
  ),
);
