import { PrismaClient, type VacancyRoleCategory, type VacancyStatus } from "@prisma/client";
import {
  offerFeaturedHighlights,
  WMC_RECRUITMENT_OFFER,
} from "../src/recruitment/offer-config";

const prisma = new PrismaClient();

type SeedVacancy = {
  key: string;
  title: string;
  status: VacancyStatus;
  location: string;
  employmentType: string;
  roleCategory: VacancyRoleCategory;
  shortSummary: string;
  fullDescription: string;
  offerHighlights: string[];
  requirements: string[];
  displayOrder: number;
  active: boolean;
};

const VACANCIES: SeedVacancy[] = [
  {
    key: "gp-now-hiring",
    title: "General Practitioner (GP)",
    status: "now_hiring",
    location: WMC_RECRUITMENT_OFFER.locationLabel,
    employmentType: "Full-Time or Part-Time",
    roleCategory: "general_practitioner",
    shortSummary:
      "Join an established community-focused general practice focused on continuity of care, clinical excellence and long-term patient relationships.",
    fullDescription:
      "Join a trusted Brisbane general practice supporting a diverse and established patient community.\n\nThis opportunity offers flexibility, clinical autonomy and strong administrative support within a collaborative healthcare environment.",
    // Remuneration / guarantee facts come only from Recruitment Offer Config — never hard-code competing numbers.
    offerHighlights: [
      ...offerFeaturedHighlights(),
      "Flexible full-time or part-time arrangements",
      "Supportive multidisciplinary team",
      "Modern facilities and systems",
    ],
    requirements: [
      "Current AHPRA registration",
      "Appropriate vocational registration",
      "Commitment to patient-centred care",
      "Strong communication and teamwork skills",
    ],
    displayOrder: 1,
    active: true,
  },
  {
    key: "practice-nurse-now-hiring",
    title: "Practice Nurse",
    status: "now_hiring",
    location: WMC_RECRUITMENT_OFFER.locationLabel,
    employmentType: "Full-Time",
    roleCategory: "practice_nurse",
    shortSummary:
      "Join our experienced clinical team and support high-quality patient care across chronic disease management, preventive health and clinical services.",
    fullDescription:
      "We are seeking a motivated and patient-focused Practice Nurse to contribute to a broad range of healthcare services alongside experienced GPs and healthcare professionals.\n\nKey Areas:\n- Chronic disease management\n- Vaccinations\n- Preventive healthcare\n- Health assessments\n- Patient education\n- Clinical support procedures",
    offerHighlights: [
      "Full-time role",
      "Supportive multidisciplinary team",
      "Professional development opportunities",
      "Modern clinical systems",
      "Diverse patient interactions",
    ],
    requirements: [
      "Current nursing registration",
      "Strong communication skills",
      "Team-oriented approach",
      "Commitment to quality healthcare",
    ],
    displayOrder: 2,
    active: true,
  },
  {
    key: "medical-receptionist-eoi",
    title: "Medical Receptionist",
    status: "expression_of_interest",
    location: WMC_RECRUITMENT_OFFER.locationLabel,
    employmentType: "",
    roleCategory: "reception",
    shortSummary: "Expressions of interest welcome from reception professionals who support calm, patient-centred clinic access.",
    fullDescription: `Register interest for future Medical Receptionist opportunities at ${WMC_RECRUITMENT_OFFER.clinicDisplayName}.`,
    offerHighlights: [],
    requirements: [],
    displayOrder: 3,
    active: true,
  },
  {
    key: "allied-health-eoi",
    title: "Allied Health Professional",
    status: "expression_of_interest",
    location: WMC_RECRUITMENT_OFFER.locationLabel,
    employmentType: "",
    roleCategory: "allied_health",
    shortSummary: "Expressions of interest welcome from allied health professionals aligned with community general practice.",
    fullDescription: `Register interest for future Allied Health opportunities supporting multidisciplinary care at ${WMC_RECRUITMENT_OFFER.clinicDisplayName}.`,
    offerHighlights: [],
    requirements: [],
    displayOrder: 4,
    active: true,
  },
];

async function main() {
  const clinic = await prisma.clinic.findUnique({ where: { slug: "woolloongabba" } });
  if (!clinic) throw new Error("Woolloongabba clinic missing. Run npm run db:seed first.");

  for (const item of VACANCIES) {
    const existing = await prisma.vacancy.findFirst({
      where: { clinicId: clinic.id, title: item.title, roleCategory: item.roleCategory },
    });
    const data = {
      title: item.title,
      status: item.status,
      location: item.location,
      employmentType: item.employmentType,
      roleCategory: item.roleCategory,
      shortSummary: item.shortSummary,
      fullDescription: item.fullDescription,
      offerHighlights: item.offerHighlights,
      requirements: item.requirements,
      displayOrder: item.displayOrder,
      active: item.active,
    };
    if (existing) {
      await prisma.vacancy.update({ where: { id: existing.id }, data });
      console.log(`updated ${item.key}`);
    } else {
      await prisma.vacancy.create({ data: { clinicId: clinic.id, ...data } });
      console.log(`created ${item.key}`);
    }
  }

  // Strip unverified remuneration/guarantee claims from any GP vacancy not covered by exact seed titles.
  const gpRoles = ["general_practitioner", "gp_registrar"] as const;
  const gpRows = await prisma.vacancy.findMany({
    where: { clinicId: clinic.id, roleCategory: { in: [...gpRoles] } },
  });
  for (const row of gpRows) {
    const joined = [...row.offerHighlights, row.remunerationNote].join(" ");
    if (!/\$\s*\d|per\s*hour|guarantee/i.test(joined)) continue;
    await prisma.vacancy.update({
      where: { id: row.id },
      data: {
        remunerationNote: "",
        offerHighlights: [
          ...offerFeaturedHighlights(),
          ...row.offerHighlights.filter(
            (h) => !/(\$\s*\d|per\s*hour|guarantee|\d+\s*%|billings?)/i.test(h),
          ),
        ],
      },
    });
    console.log(`sanitised GP vacancy commercial claims: ${row.title}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
