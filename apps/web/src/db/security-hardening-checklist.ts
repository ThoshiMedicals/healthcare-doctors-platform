/**
 * Offline security hardening checklist for a new production Supabase project.
 * Do not execute against live Supabase from B1A — procedures only.
 */

export type SecurityChecklistItem = {
  id: string;
  title: string;
  procedure: string[];
  verifySqlOrAction: string[];
};

export const PRODUCTION_SECURITY_CHECKLIST: SecurityChecklistItem[] = [
  {
    id: "disable-data-api",
    title: "Disable Supabase Data API (PostgREST)",
    procedure: [
      "Project Settings → Data API / API → turn Enable Data API off.",
      "Confirm the app uses Prisma only (no supabase-js data client for CMS tables).",
    ],
    verifySqlOrAction: [
      "Dashboard: Data API disabled",
      "HTTP probe to /rest/v1/ should not expose public tables (after disable)",
    ],
  },
  {
    id: "prisma-role",
    title: "Least-privilege Prisma database role",
    procedure: [
      "Create role prisma (or app_runtime) with LOGIN and a strong password.",
      "GRANT USAGE ON SCHEMA public TO prisma;",
      "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO prisma;",
      "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO prisma;",
      "ALTER DEFAULT PRIVILEGES for future tables accordingly.",
      "Point Hostinger DATABASE_URL user at this role (transaction pooler).",
    ],
    verifySqlOrAction: [
      "SELECT rolname FROM pg_roles WHERE rolname = 'prisma';",
      "Confirm Hostinger runtime is not using the postgres superuser URL.",
    ],
  },
  {
    id: "revoke-anon-authenticated",
    title: "Revoke Data API role grants on public tables",
    procedure: [
      "REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;",
      "REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;",
      "REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;",
      "Optionally revoke from service_role if unused by the Node app.",
    ],
    verifySqlOrAction: [
      "SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants WHERE table_schema = 'public' AND grantee IN ('anon','authenticated');",
      "Expect zero rows for CMS/private tables.",
    ],
  },
  {
    id: "enable-rls",
    title: "Enable RLS on all public application tables",
    procedure: [
      "After migrate deploy, ENABLE ROW LEVEL SECURITY on every Prisma-mapped public table.",
      "Especially: users, sessions, accounts, career_applications, form_requests, private_objects, pages, page_revisions.",
      "Do not add permissive anon policies while Data API is disabled unless a deliberate product need appears.",
    ],
    verifySqlOrAction: [
      "SELECT relname, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND relkind = 'r' ORDER BY relname;",
      "Expect relrowsecurity = true for application tables.",
    ],
  },
  {
    id: "private-data",
    title: "Protect private_objects, users, applications",
    procedure: [
      "Confirm no Storage public bucket holds private_objects bytes.",
      "Confirm career_applications / form_requests have RLS enabled and no anon grants.",
      "Run Security Advisor after migrate + grants.",
    ],
    verifySqlOrAction: [
      "Advisor: no publicly writable tables",
      "Spot-check grants on private_objects, users, career_applications",
    ],
  },
];

/** Fixture SQL statements for documentation / dry review — not auto-executed. */
export const SECURITY_HARDENING_SQL_FIXTURE = `
-- EXAMPLE ONLY — review before any production execution.
-- REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
-- ALTER TABLE public.private_objects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.form_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.page_revisions ENABLE ROW LEVEL SECURITY;
`.trim();
