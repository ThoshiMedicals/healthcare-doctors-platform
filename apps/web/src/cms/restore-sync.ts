export type ClinicHour = { dayOfWeek: string; opens: string; closes: string };

export type ClinicEditorValues = {
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  phoneDisplay: string;
  email: string;
  hotdocUrl: string;
  openingHours: ClinicHour[];
};

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function textValue(value: unknown, fallback: unknown): string {
  if (typeof value === "string") return value;
  return typeof fallback === "string" ? fallback : "";
}

export function snapshotStatus(data: Record<string, unknown>): string {
  const value = data.contentStatus ?? data.status;
  return typeof value === "string" ? value : "";
}

function hoursFrom(value: unknown, fallback: unknown): ClinicHour[] {
  const source = Array.isArray(value) ? value : Array.isArray(fallback) ? fallback : [];
  return source.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    if (!item.dayOfWeek) return [];
    return [{ dayOfWeek: String(item.dayOfWeek), opens: String(item.opens ?? ""), closes: String(item.closes ?? "") }];
  });
}

export function alignRestoredSnapshot(entityType: string, data: Record<string, unknown>): Record<string, unknown> {
  const status = snapshotStatus(data);
  const withStatus = status
    ? { ...data, status: typeof data.status === "string" ? data.status : status, contentStatus: typeof data.contentStatus === "string" ? data.contentStatus : status }
    : { ...data };
  if (status !== "published") return withStatus;

  const live = record(data.publishedPayload);
  if (!live) return { ...withStatus, status: "published", contentStatus: "published" };

  if (entityType === "clinic_settings") {
    return {
      ...withStatus,
      streetAddress: textValue(live.streetAddress, data.streetAddress),
      suburb: textValue(live.suburb, data.suburb),
      state: textValue(live.state, data.state),
      postcode: textValue(live.postcode, data.postcode),
      phoneDisplay: textValue(live.phoneDisplay, data.phoneDisplay),
      email: textValue(live.email, data.email),
      hotdocUrl: "hotdocUrl" in live ? live.hotdocUrl ?? "" : data.hotdocUrl,
      openingHours: Array.isArray(live.openingHours) ? live.openingHours : data.openingHours,
      status: "published",
      contentStatus: "published",
    };
  }

  if (entityType === "practitioner") {
    return {
      ...withStatus,
      name: textValue(live.name, data.name),
      biography: typeof live.biography === "string" ? live.biography : data.biography,
      qualifications: live.qualifications ?? data.qualifications,
      languages: live.languages ?? data.languages,
      areasOfCare: live.areasOfCare ?? data.areasOfCare,
      professionalInterests: live.professionalInterests ?? data.professionalInterests,
      portraitPath: typeof live.portraitFile === "string" && live.portraitFile ? live.portraitFile : data.portraitPath,
      bookingUrl: live.bookingUrl ?? data.bookingUrl,
      status: "published",
      contentStatus: "published",
    };
  }

  const next: Record<string, unknown> = { ...withStatus, status: "published", contentStatus: "published" };
  if (typeof live.title === "string") next.title = live.title;
  if (typeof live.summary === "string") next.summary = live.summary;
  if (typeof live.author === "string") next.author = live.author;
  if (
    (entityType === "service" || entityType === "knowledge_article" || entityType === "practice_page") &&
    (live.sections || live.kind)
  ) {
    next.document = live.document ?? live;
  }
  return next;
}

export function clinicEditorValues(input: ClinicEditorValues & { contentStatus: string; publishedPayload: unknown }): ClinicEditorValues {
  const columns: ClinicEditorValues = {
    streetAddress: input.streetAddress,
    suburb: input.suburb,
    state: input.state,
    postcode: input.postcode,
    phoneDisplay: input.phoneDisplay,
    email: input.email,
    hotdocUrl: input.hotdocUrl,
    openingHours: input.openingHours,
  };
  if (input.contentStatus !== "published") return columns;
  const live = record(input.publishedPayload);
  if (!live) return columns;
  const hours = hoursFrom(live.openingHours, input.openingHours);
  return {
    streetAddress: textValue(live.streetAddress, input.streetAddress) || input.streetAddress,
    suburb: textValue(live.suburb, input.suburb) || input.suburb,
    state: textValue(live.state, input.state) || input.state,
    postcode: textValue(live.postcode, input.postcode) || input.postcode,
    phoneDisplay: textValue(live.phoneDisplay, input.phoneDisplay) || input.phoneDisplay,
    email: textValue(live.email, input.email) || input.email,
    hotdocUrl: textValue(live.hotdocUrl, input.hotdocUrl) || input.hotdocUrl,
    openingHours: hours.length ? hours : input.openingHours,
  };
}

export function publishedPractitionerFields(status: string, payload: unknown) {
  if (status !== "published") return null;
  const live = record(payload);
  if (!live) return null;
  const list = (value: unknown) => (Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean).join(", ") : "");
  return {
    name: typeof live.name === "string" ? live.name : "",
    biography: typeof live.biography === "string" ? live.biography : "",
    qualifications: list(live.qualifications),
    languages: list(live.languages),
    areasOfCare: list(live.areasOfCare),
    professionalInterests: list(live.professionalInterests),
    portraitFile: typeof live.portraitFile === "string" ? live.portraitFile : "",
    bookingUrl: typeof live.bookingUrl === "string" ? live.bookingUrl : "",
  };
}
