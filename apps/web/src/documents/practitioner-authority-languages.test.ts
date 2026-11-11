import assert from "node:assert/strict";
import test from "node:test";
import {
  applyApprovedPractitionerLanguages,
  APPROVED_PRACTITIONER_LANGUAGES,
} from "./practitioner-authority-languages";

const PLACEHOLDER =
  "No practitioner-specific languages are listed in the current verified public profile.";

test("owner-approved language map covers Mary, Nirupa, and Samuel only", () => {
  assert.deepEqual(APPROVED_PRACTITIONER_LANGUAGES["dr-mary-abadir"], ["English", "Russian"]);
  assert.deepEqual(APPROVED_PRACTITIONER_LANGUAGES["dr-nirupa-sivathasan"], ["English"]);
  assert.deepEqual(APPROVED_PRACTITIONER_LANGUAGES["mr-samuel-stafford"], ["English"]);
  assert.equal(Object.keys(APPROVED_PRACTITIONER_LANGUAGES).length, 3);
});

test("fills Mary credentials, FAQ, and Person knowsLanguage without inventing quals", () => {
  const html =
    `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Person",
          name: "Dr Mary Abadir",
          url: "https://gabbamedicalcentre.com.au/doctors/dr-mary-abadir.html",
        },
        {
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What languages does Dr Mary Abadir speak?",
              acceptedAnswer: { "@type": "Answer", text: PLACEHOLDER },
            },
          ],
        },
      ],
    })}</script>` +
    `<section id="credentials"><div><h2>Qualifications</h2><p>M.B.B.Ch, MRCOG, FRANZCOG</p></div>` +
    `<div><h2>Languages</h2><p>${PLACEHOLDER}</p></div></section>` +
    `<details><summary>What languages does Dr Mary Abadir speak?</summary><p>${PLACEHOLDER}</p></details>`;

  const next = applyApprovedPractitionerLanguages(html, "doctors/dr-mary-abadir.html");
  assert.match(next, /<h2>Languages<\/h2><p>English and Russian<\/p>/);
  assert.match(next, /<summary>What languages does Dr Mary Abadir speak\?<\/summary><p>English and Russian<\/p>/);
  assert.doesNotMatch(next, new RegExp(PLACEHOLDER.replace(/\./g, "\\.")));
  assert.match(next, /M\.B\.B\.Ch, MRCOG, FRANZCOG/);

  const json = JSON.parse(next.match(/<script[^>]*>([\s\S]*?)<\/script>/i)![1]);
  const person = json["@graph"].find((n: { "@type": string }) => n["@type"] === "Person");
  const faq = json["@graph"].find((n: { "@type": string }) => n["@type"] === "FAQPage");
  assert.deepEqual(person.knowsLanguage, ["English", "Russian"]);
  assert.equal(faq.mainEntity[0].acceptedAnswer.text, "English and Russian");
  assert.equal(
    applyApprovedPractitionerLanguages(next, "doctors/dr-mary-abadir.html"),
    next,
  );
});

test("fills Nirupa and Samuel with English only", () => {
  const shell = (name: string) =>
    `<section id="credentials"><div><h2>Languages</h2><p>${PLACEHOLDER}</p></div></section>` +
    `<details><summary>What languages does ${name} speak?</summary><p>${PLACEHOLDER}</p></details>`;

  const nirupa = applyApprovedPractitionerLanguages(
    shell("Dr Nirupa Sivathasan"),
    "doctors/dr-nirupa-sivathasan.html",
  );
  assert.match(nirupa, /<h2>Languages<\/h2><p>English<\/p>/);

  const samuel = applyApprovedPractitionerLanguages(
    shell("Mr Samuel Stafford"),
    "doctors/mr-samuel-stafford.html",
  );
  assert.match(samuel, /<h2>Languages<\/h2><p>English<\/p>/);
});

test("does not alter unrelated practitioner profiles", () => {
  const html = `<section id="credentials"><div><h2>Languages</h2><p>${PLACEHOLDER}</p></div></section>`;
  assert.equal(applyApprovedPractitionerLanguages(html, "doctors/dr-tanya-goodwill.html"), html);
});
