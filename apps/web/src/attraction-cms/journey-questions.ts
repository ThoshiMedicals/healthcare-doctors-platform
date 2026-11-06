/**
 * Question-led journey layer for doctors considering joining.
 * Copy-only: questions, answers, next-question framing.
 * Does not change URLs, IA, destinations, or CTA targets.
 *
 * Recommended Next composition (ev-shell):
 *   title  = nextTitle
 *   blurb  = answered + " " + nextQuestion + " " + nextBlurb
 */

export type JourneyPageKey =
  | "join-our-team.html"
  | "practice-experience.html"
  | "community-catchment.html"
  | "continuity-in-practice.html"
  | "clinical-interests.html"
  | "gp-opportunities.html"
  | "practice-support.html"
  | "registrar-pathway.html"
  | "gp-faq.html"
  | "doctor-readiness.html"
  | "provider-number-readiness.html"
  | "dpa-navigator.html"
  | "session-planner.html"
  | "opportunity-pack.html"
  | "express-interest.html";

export type JourneyPageCopy = {
  /** Question the GP brings — shown as hero eyebrow above the page title */
  question: string;
  /** Short answer framing — hero lede (presentation layer) */
  answerLede: string;
  /** Optional h1 override when the title itself should be the question */
  h1?: string;
  /** What this page just answered — Recommended Next bridge open */
  answered: string;
  /** The question that naturally follows */
  nextQuestion: string;
  /** Recommended Next heading (the next question, in the GP’s voice) */
  nextTitle: string;
  /** Why the primary next page is the natural place to go (name the page’s job) */
  nextBlurb: string;
};

export const JOURNEY_BY_PAGE: Record<JourneyPageKey, JourneyPageCopy> = {
  "join-our-team.html": {
    question: "Could this practice be a fit?",
    answerLede:
      "Read how the practice works, see whether it suits you, and get in touch when you are ready — in whatever order makes sense.",
    h1: "Join Our Team",
    answered: "You have a simple way into the practice pages.",
    nextQuestion: "Most doctors start by asking what the week feels like in the rooms.",
    nextTitle: "What is a consulting week here actually like?",
    nextBlurb:
      "Practice Experience is next — day shape, nursing, reception, continuity and sessions, so you are not guessing from a homepage.",
  },
  "practice-experience.html": {
    question: "What is it actually like to work here?",
    answerLede:
      "How a consulting week runs at this inner-south Brisbane practice — day shape, nursing, reception, continuity and sessions — so you can judge fit for yourself.",
    h1: "What practising here is like",
    answered: "You have seen how the day and the team actually work.",
    nextQuestion: "The natural follow-on is whether that way of practising would suit you.",
    nextTitle: "Would this practice suit how I want to work?",
    nextBlurb:
      "GP Opportunities is next — fit in plain language, plus any roles currently advertised.",
  },
  "community-catchment.html": {
    question: "Who will I be caring for?",
    answerLede:
      "Where we are in Brisbane, who lives and works nearby, and how that shapes the consulting book — so you can sense whether this practice matches how you want to practise.",
    h1: "Who we look after around here",
    answered: "You know where the practice sits and who shapes the book.",
    nextQuestion: "Once you know the community, the next question is how relationships return across the week.",
    nextTitle: "How does continuity show up day to day?",
    nextBlurb:
      "Continuity in Practice is next — same-GP habits, recalls and handoffs — because place alone does not explain how care holds together.",
  },
  "continuity-in-practice.html": {
    question: "How does continuity actually work here?",
    answerLede:
      "Same-GP booking habits, recalls, notes that assume shared history, and clear handoffs when care moves outside the practice.",
    h1: "How continuity works here",
    answered: "You understand how continuity is meant to work here.",
    nextQuestion: "Knowing that, you may ask whether this practice would suit your style of medicine.",
    nextTitle: "Would this practice suit how I want to work?",
    nextBlurb:
      "GP Opportunities is next to weigh overall fit. If special interests matter first, Clinical Interests is there as a side path — same destinations as before.",
  },
  "clinical-interests.html": {
    question: "Can my clinical interests sit inside general practice here?",
    answerLede:
      "We are a general practice first. Special interests are welcome when they help local patients and fit credentialing, team capacity and safe scope.",
    h1: "Clinical interests inside general practice",
    answered: "You can see how interests sit inside continuity care — not instead of it.",
    nextQuestion: "The next decision is whether the practice as a whole feels like a fit.",
    nextTitle: "Would this practice suit how I want to work?",
    nextBlurb:
      "GP Opportunities brings clinical fit back into the wider suitability picture — including any current roles and how a conversation usually starts.",
  },
  "gp-opportunities.html": {
    question: "Would I fit here?",
    answerLede:
      "We practise continuity and long-term relationships. See any current roles early, then judge fit — commercial detail on an advert is a starting point, not the whole conversation.",
    h1: "Is Woolloongabba Medical Centre the right practice for you?",
    answered: "You have a clearer sense of whether this practice shape fits you.",
    nextQuestion: "If it might fit, the next practical question is what surrounds the consult.",
    nextTitle: "What sits around the consult day to day?",
    nextBlurb:
      "Practice Support is next — rooms, nursing, reception and systems — so fit is not judged on philosophy alone. Keep a short set of pages if you want to think it over.",
  },
  "practice-support.html": {
    question: "What sits around the consult?",
    answerLede:
      "Rooms, nursing, reception and systems around the consult — so you can see what sits beside the clinical work.",
    h1: "How the practice supports consulting",
    answered: "You know what support sits around consulting here.",
    nextQuestion: "The next useful step is often noting which days you would hope to work.",
    nextTitle: "Which days might work for me?",
    nextBlurb:
      "Preferred days is next if you want a private note only — not a booking — so you can arrive at a conversation with days already thought through.",
  },
  "registrar-pathway.html": {
    question: "Is there a pathway if I am early in my GP career?",
    answerLede:
      "Supervision, training support and session growth — timed against what the practice can offer now.",
    h1: "Registrar and early career",
    answered: "You understand how early-career conversations work here — subject to capacity.",
    nextQuestion: "Whether or not a pathway opens soon, you still need to know what surrounds the consult.",
    nextTitle: "What sits around the consult day to day?",
    nextBlurb:
      "Practice Support is next because early-career fit still depends on rooms, nursing and systems — or Express Interest when you are ready to talk.",
  },
  "gp-faq.html": {
    question: "What do doctors usually ask before getting in touch?",
    answerLede: "Straight answers to the questions doctors often ask before writing or calling.",
    h1: "Questions doctors ask about joining",
    answered: "The common questions have a straight answer from the practice.",
    nextQuestion: "After the FAQ, some doctors like an optional pause before writing.",
    nextTitle: "Am I ready to talk with the practice?",
    nextBlurb:
      "Am I ready to talk? is optional — not a gate. Express Interest remains available if you already know enough.",
  },
  "doctor-readiness.html": {
    question: "Optional — am I ready to talk?",
    answerLede:
      "This may help if you are still working something out. It is not required, not an assessment, and not a gate — call or write whenever you like.",
    h1: "Am I ready to talk with the practice?",
    answered: "You have a private sense of where you stand — if you chose to use this page.",
    nextQuestion: "Before you write or call, you may want something short to keep.",
    nextTitle: "Would I like a few pages to keep?",
    nextBlurb:
      "Pages to keep gathers the useful practice links in one place — then Express Interest when you want the conversation itself.",
  },
  "provider-number-readiness.html": {
    question: "Optional — provider numbers",
    answerLede:
      "Only if provider numbers are still on your mind. What we can help with for paperwork — and the clear line that Services Australia issues provider numbers, not us.",
    h1: "What should I know about provider numbers?",
    answered: "You know the provider-number boundary before a conversation.",
    nextQuestion: "The related paperwork question is often whether DPA or 19AB rules affect you.",
    nextTitle: "Do DPA or 19AB rules affect me?",
    nextBlurb:
      "DPA & 19AB is next for that orientation — official answers stay with government sources, not the practice. Skip it if those rules do not apply to you.",
  },
  "dpa-navigator.html": {
    question: "Optional — DPA & 19AB",
    answerLede:
      "Skip this if Distribution Priority Area (DPA) or Health Insurance Act s19AB rules do not apply to you. Official answers come from government sources, not from the practice.",
    h1: "Do DPA or 19AB rules affect me?",
    answered: "You have a plain next step for location or 19AB questions — if they apply.",
    nextQuestion: "With that orientation done, you may ask whether you feel ready to talk.",
    nextTitle: "Am I ready to talk with the practice?",
    nextBlurb:
      "Am I ready to talk? is an optional check-in. Return to GP FAQ only if another factual question is still open.",
  },
  "session-planner.html": {
    question: "Optional — preferred days",
    answerLede:
      "Sketch the consulting week you have in mind if that helps. We confirm sessions with you — this is only a private note, not a request for rooms.",
    h1: "Which days might work?",
    answered: "You have noted preferred days for a later conversation — if you wanted to.",
    nextQuestion: "With days sketched, you may want a short set of pages to keep while you decide.",
    nextTitle: "Would I like a few pages to keep?",
    nextBlurb:
      "Pages to keep gathers fit and support links — then Express Interest when you want to talk with the practice.",
  },
  "opportunity-pack.html": {
    question: "Would I like a few pages to keep?",
    answerLede:
      "Key pages about the practice, support and next steps — for when you want to think before you talk with us.",
    h1: "A few pages to take away",
    answered: "You have a summary you can keep.",
    nextQuestion: "When the questions feel answered, the natural continuation is a conversation — not another page of reading.",
    nextTitle: "Am I ready to talk to the practice?",
    nextBlurb:
      "Express Interest is next because it starts a short note with the practice. Call about joining if you would rather speak now.",
  },
  "express-interest.html": {
    question: "Confidential GP enquiry",
    answerLede: "",
    h1: "Request a confidential discussion",
    answered: "Your note is with the practice.",
    nextQuestion: "",
    nextTitle: "",
    nextBlurb: "",
  },
};

export function journeyFor(pageKey: string): JourneyPageCopy | undefined {
  return JOURNEY_BY_PAGE[pageKey as JourneyPageKey];
}
