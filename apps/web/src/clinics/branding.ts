/**
 * Presentation fields sourced from Clinic + ClinicProfile.
 * Used by public-ux / runtime inject; golden HTML stays frozen.
 */
export type ClinicBranding = {
  clinicSlug: string;
  practiceName: string;
  phoneDisplay: string;
  phoneTel: string;
  email: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  hotdocUrl: string;
  logoPath: string;
};

export const DEFAULT_CLINIC_BRANDING: ClinicBranding = {
  clinicSlug: "woolloongabba",
  practiceName: "Woolloongabba Medical Centre",
  phoneDisplay: "(07) 3217 3344",
  phoneTel: "0732173344",
  email: "admin@gabbamedicalcentre.com.au",
  streetAddress: "31 Annerley Road",
  suburb: "Woolloongabba",
  state: "QLD",
  postcode: "4102",
  hotdocUrl:
    "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox",
  logoPath: "",
};

export function brandingFromClinic(input: {
  slug: string;
  practiceName: string;
  profile: {
    phoneDisplay: string;
    phoneTel: string;
    email: string;
    streetAddress: string;
    suburb: string;
    state: string;
    postcode: string;
    hotdocUrl: string | null;
    logoPath: string | null;
  } | null;
}): ClinicBranding {
  const profile = input.profile;
  return {
    clinicSlug: input.slug,
    practiceName: input.practiceName || DEFAULT_CLINIC_BRANDING.practiceName,
    phoneDisplay: profile?.phoneDisplay || DEFAULT_CLINIC_BRANDING.phoneDisplay,
    phoneTel: profile?.phoneTel || DEFAULT_CLINIC_BRANDING.phoneTel,
    email: profile?.email || DEFAULT_CLINIC_BRANDING.email,
    streetAddress: profile?.streetAddress || DEFAULT_CLINIC_BRANDING.streetAddress,
    suburb: profile?.suburb || DEFAULT_CLINIC_BRANDING.suburb,
    state: profile?.state || DEFAULT_CLINIC_BRANDING.state,
    postcode: profile?.postcode || DEFAULT_CLINIC_BRANDING.postcode,
    hotdocUrl: profile?.hotdocUrl || DEFAULT_CLINIC_BRANDING.hotdocUrl,
    logoPath: profile?.logoPath || "",
  };
}

export function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
