import assert from "node:assert/strict";
import test from "node:test";
import { offerCommercialFaqItems } from "./commercial-faq";

test("commercial FAQ covers the eight opportunity questions from offer/contact SSoT", () => {
  const items = offerCommercialFaqItems();
  assert.equal(items.length, 8);
  assert.deepEqual(
    items.map((i) => i.question),
    [
      "How does the 75% arrangement work?",
      "How are patients allocated?",
      "Is weekend work required?",
      "Can sessions be part-time?",
      "What support is available?",
      "What software does the clinic use?",
      "What is onboarding like?",
      "Who responds to recruitment enquiries?",
    ],
  );
  assert.match(items[0]!.answer, /75% billings/);
  assert.match(items[1]!.answer, /70,000\+/);
  assert.match(items[2]!.answer, /not a blanket requirement/i);
  assert.match(items[3]!.answer, /part-time/i);
  assert.match(items[4]!.answer, /5\+ nurses/);
  assert.match(items[5]!.answer, /HotDoc/);
  assert.doesNotMatch(items[5]!.answer, /Best Practice|Medical Director|Genie/i);
  assert.match(items[6]!.answer, /onboarding/i);
  assert.match(items[7]!.answer, /Roshan Samarawickrema/);
});
