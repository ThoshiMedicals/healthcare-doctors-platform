/**
 * Recruitment / Attraction HOLD policy for production import and public serving.
 * Importing HTML into the CMS must not automatically enable public recruitment workflows.
 *
 * Lift HOLD only with explicit env: RECRUITMENT_HOLD_LIFTED=true (operator GO).
 */

export type RecruitmentHoldPolicy = {
  path: string;
  /** May a published page row exist in the production database? */
  mayExistInProductionDb: boolean;
  /** May the public site serve the HTML at this path? */
  mayServePublicly: boolean;
  /** May search engines index the path? */
  mayIndex: boolean;
  /** May EOI / career application / GP pipeline forms accept submissions? */
  mayOperateFormsAndWorkflows: boolean;
  /** What approval lifts HOLD (all that apply). */
  approvalToLiftHold: string[];
  holdActive: boolean;
  notes: string[];
};

/** Global recruitment HOLD is active unless explicitly lifted by operator env. */
export function isRecruitmentHoldActive(env: Record<string, string | undefined> = process.env): boolean {
  return env.RECRUITMENT_HOLD_LIFTED !== "true";
}

/**
 * Whether a CMS path may be returned on the public document render path.
 * When HOLD is lifted, all classified recruitment paths follow normal publish rules.
 */
export function canServeRecruitmentPathPublicly(
  path: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (!isRecruitmentHoldActive(env)) return true;
  const policy = recruitmentHoldForPath(path);
  if (!policy) return true;
  return policy.mayServePublicly;
}

/** Public recruitment workflows (EOI, career apply, readiness submit) while HOLD is on. */
export function canOperateRecruitmentPublicWorkflows(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return !isRecruitmentHoldActive(env);
}

/** Force noindex for recruitment paths that may be served under HOLD (e.g. join hub). */
export function mustNoIndexRecruitmentPath(
  path: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (!isRecruitmentHoldActive(env)) return false;
  const policy = recruitmentHoldForPath(path);
  if (!policy) return false;
  return !policy.mayIndex;
}

const JOIN_HUB = "join-our-team.html";

const JOIN_CHILD_PATHS = [
  "join-our-team/doctor-readiness.html",
  "join-our-team/dpa-navigator.html",
  "join-our-team/express-interest.html",
  "join-our-team/gp-faq.html",
  "join-our-team/gp-opportunities.html",
  "join-our-team/opportunity-pack.html",
  "join-our-team/practice-support.html",
  "join-our-team/provider-number-readiness.html",
  "join-our-team/registrar-pathway.html",
  "join-our-team/session-planner.html",
] as const;

const WORKFLOW_FORM_PATHS = new Set<string>([
  "join-our-team/express-interest.html",
  "join-our-team/doctor-readiness.html",
]);

export function isRecruitmentPath(path: string): boolean {
  return path === JOIN_HUB || path.startsWith("join-our-team/");
}

/**
 * HOLD defaults for production until Attraction Index Gate + operator GO.
 * Hub may exist for patient-facing "VR GP role" messaging; child Attraction tools stay restricted.
 */
export function recruitmentHoldForPath(path: string): RecruitmentHoldPolicy | null {
  if (!isRecruitmentPath(path)) return null;

  const isHub = path === JOIN_HUB;
  const isChild = (JOIN_CHILD_PATHS as readonly string[]).includes(path);
  const forms = WORKFLOW_FORM_PATHS.has(path);

  if (isHub) {
    return {
      path,
      mayExistInProductionDb: true,
      mayServePublicly: true,
      mayIndex: false,
      mayOperateFormsAndWorkflows: false,
      approvalToLiftHold: [
        "Attraction Index Gate PASS",
        "Operator GO for recruitment indexing",
        "Clinical/practice marketing approval for public GP recruitment claims",
      ],
      holdActive: true,
      notes: [
        "Golden join hub may be imported and served.",
        "Keep noindex until Index Gate PASS.",
        "Do not enable career application / EOI APIs as part of page import.",
      ],
    };
  }

  if (isChild) {
    return {
      path,
      mayExistInProductionDb: true,
      mayServePublicly: false,
      mayIndex: false,
      mayOperateFormsAndWorkflows: false,
      approvalToLiftHold: [
        "Attraction publish-ready validation PASS",
        "Attraction Index Gate PASS",
        "Operator GO to serve Attraction/PE child routes publicly",
        forms ? "Security review of EOI/readiness form endpoints on production" : "Practice approver sign-off for Attraction page set",
      ],
      holdActive: true,
      notes: [
        "Class B non-golden Attraction page — DB row allowed only under HOLD.",
        "Public serve and indexing remain OFF until HOLD lifted.",
        forms
          ? "Form/workflow endpoints must stay disabled or non-routable on production until explicit GO."
          : "Informational Attraction page — still not publicly served under HOLD.",
      ],
    };
  }

  return {
    path,
    mayExistInProductionDb: false,
    mayServePublicly: false,
    mayIndex: false,
    mayOperateFormsAndWorkflows: false,
    approvalToLiftHold: ["Operator classification of unknown recruitment path"],
    holdActive: true,
    notes: ["Unlisted recruitment-related path — default deny until classified."],
  };
}

export function listRecruitmentHoldPolicies(): RecruitmentHoldPolicy[] {
  return [JOIN_HUB, ...JOIN_CHILD_PATHS].map((path) => recruitmentHoldForPath(path)!);
}
