import { PrismaClient, type DayOfWeek, type MembershipRole } from "@prisma/client";
import { hashPassword } from "../src/auth/password";

const prisma = new PrismaClient();

const HOURS: Array<{ dayOfWeek: DayOfWeek; opens: string; closes: string }> = [
  { dayOfWeek: "monday", opens: "07:00", closes: "19:00" },
  { dayOfWeek: "tuesday", opens: "07:00", closes: "19:00" },
  { dayOfWeek: "wednesday", opens: "07:00", closes: "19:00" },
  { dayOfWeek: "thursday", opens: "07:00", closes: "19:00" },
  { dayOfWeek: "friday", opens: "08:00", closes: "17:00" },
  { dayOfWeek: "saturday", opens: "09:00", closes: "17:00" },
  { dayOfWeek: "sunday", opens: "09:00", closes: "15:00" },
];

const NAVIGATION = [
  { sectionKey: "services", label: "Services", href: "services.html", sortOrder: 1 },
  { sectionKey: "team", label: "Our Team", href: "team.html", sortOrder: 2 },
  { sectionKey: "about", label: "About Us", href: "about-us.html", sortOrder: 3 },
  { sectionKey: "patient-info", label: "Patient Information", href: "patient-information.html", sortOrder: 4 },
  { sectionKey: "knowledge", label: "Knowledge Centre", href: "knowledge/index.html", sortOrder: 5 },
  { sectionKey: "updates", label: "Updates", href: "updates/index.html", sortOrder: 6 },
  { sectionKey: "contact", label: "Contact", href: "contact.html", sortOrder: 7 },
];

const EXTERNAL_LOCATIONS = [
  "Forest Lake",
  "Eight Mile Plains",
  "Indooroopilly",
  "Chapel Hill",
  "Cannon Hill",
  "Bald Hills",
];

async function main() {
  const network = await prisma.network.upsert({
    where: { id: "network_healthcare_doctors" },
    update: {
      name: "Healthcare Doctors",
      positioning:
        "Community-focused medical centre network across Brisbane. Services, practitioners, appointment availability and billing arrangements can vary between clinics.",
    },
    create: {
      id: "network_healthcare_doctors",
      name: "Healthcare Doctors",
      positioning:
        "Community-focused medical centre network across Brisbane. Services, practitioners, appointment availability and billing arrangements can vary between clinics.",
    },
  });

  const clinic = await prisma.clinic.upsert({
    where: { slug: "woolloongabba" },
    update: {
      practiceName: "Woolloongabba Medical Centre",
      status: "live",
      networkId: network.id,
    },
    create: {
      networkId: network.id,
      slug: "woolloongabba",
      practiceName: "Woolloongabba Medical Centre",
      status: "live",
    },
  });

  const domains = [
    { hostname: "gabbamedicalcentre.com.au", isPrimary: true },
    { hostname: "www.gabbamedicalcentre.com.au", isPrimary: false },
  ];

  for (const domain of domains) {
    await prisma.clinicDomain.upsert({
      where: { hostname: domain.hostname },
      update: { clinicId: clinic.id, isPrimary: domain.isPrimary },
      create: { clinicId: clinic.id, hostname: domain.hostname, isPrimary: domain.isPrimary },
    });
  }

  await prisma.clinicProfile.upsert({
    where: { clinicId: clinic.id },
    update: {},
    create: {
      clinicId: clinic.id,
      phoneDisplay: "(07) 3217 3344",
      phoneTel: "+61732173344",
      faxDisplay: "(07) 3189 4808",
      email: "reception@gabbamedicalcentre.com.au",
      streetAddress: "468 Vulture Street",
      suburb: "Woolloongabba",
      state: "QLD",
      postcode: "4102",
      country: "AU",
      localitiesServed: [
        "Woolloongabba",
        "East Brisbane",
        "South Brisbane",
        "Kangaroo Point",
        "Greenslopes",
        "Stones Corner",
        "Dutton Park",
      ],
      afterHoursProvider: "Hello Home Doctor",
      afterHoursPhone: "134 100",
      afterHoursPagePath: "after-hours-care.html",
      bookingPagePath: "book-appointment.html",
      hotdocUrl:
        "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox",
      logoPath: "/assets/brand/healthcare-doctors-woolloongabba-logo.png",
      locale: "en-AU",
      canonicalBaseUrl: "https://gabbamedicalcentre.com.au",
    },
  });

  for (const hours of HOURS) {
    await prisma.openingHours.upsert({
      where: { clinicId_dayOfWeek: { clinicId: clinic.id, dayOfWeek: hours.dayOfWeek } },
      update: { opens: hours.opens, closes: hours.closes },
      create: { clinicId: clinic.id, ...hours },
    });
  }

  for (const item of NAVIGATION) {
    await prisma.navigationItem.upsert({
      where: { clinicId_sectionKey: { clinicId: clinic.id, sectionKey: item.sectionKey } },
      update: { label: item.label, href: item.href, sortOrder: item.sortOrder },
      create: { clinicId: clinic.id, ...item },
    });
  }

  await prisma.networkLocation.upsert({
    where: { id: "location_woolloongabba" },
    update: { linkedClinicId: clinic.id, status: "live" },
    create: {
      id: "location_woolloongabba",
      networkId: network.id,
      linkedClinicId: clinic.id,
      clinicName: "Woolloongabba Medical Centre",
      suburb: "Woolloongabba",
      description:
        "Inner-south Brisbane practice. This tenant is live in the platform. Page content is not imported in this phase.",
      website: "https://gabbamedicalcentre.com.au/",
      sortOrder: 0,
      status: "live",
    },
  });

  for (const [index, suburb] of EXTERNAL_LOCATIONS.entries()) {
    const id = `location_${suburb.toLowerCase().replaceAll(" ", "_")}`;
    await prisma.networkLocation.upsert({
      where: { id },
      update: {},
      create: {
        id,
        networkId: network.id,
        clinicName: suburb === "Bald Hills" ? "Bald Hills Doctors" : `${suburb} Medical Centre`,
        suburb,
        description:
          "External clinic website. Not a platform tenant until its own approved HTML corpus is imported.",
        sortOrder: index + 1,
        status: "external",
      },
    });
  }

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() || null;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const username = (process.env.SEED_ADMIN_USERNAME?.trim() || email?.split("@")[0] || "").toLowerCase();
  if (password && username) {
    const passwordHash = await hashPassword(password);
    const existing = await prisma.user.findUnique({ where: { username } });
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { passwordHash, name: "Super Admin", email: email ?? existing.email },
        })
      : await prisma.user.create({
          data: { username, email, passwordHash, name: "Super Admin" },
        });
    const role: MembershipRole = "super_admin";
    await prisma.clinicMembership.upsert({
      where: { userId_clinicId: { userId: user.id, clinicId: clinic.id } },
      update: { role },
      create: { userId: user.id, clinicId: clinic.id, role },
    });
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
