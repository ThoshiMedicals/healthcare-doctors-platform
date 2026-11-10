# P0 Full Admin CMS — migration & rollback

## Migration

Folder: `prisma/migrations/20261111090000_p0_page_lifecycle_seo_preview`

Adds:

- `clinics.public_cache_epoch` (multi-instance public HTML cache alignment)
- `pages.seo_draft` (unpublished SEO draft JSON)
- `draft_preview_tokens` table (expiring, revocable preview access)

### Local disposable database only

```powershell
# Create empty DB (example)
# createdb wmc_p0_test

$env:WMC_P0_TEST_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/wmc_p0_test?schema=public"
$env:DATABASE_URL = $env:WMC_P0_TEST_DATABASE_URL
cd apps/web
npx prisma migrate deploy
npx prisma generate
```

Do **not** run against Hostinger staging or production Supabase from this worktree.

## Rollback SQL (manual)

```sql
DROP TABLE IF EXISTS "draft_preview_tokens";
ALTER TABLE "pages" DROP COLUMN IF EXISTS "seo_draft";
ALTER TABLE "clinics" DROP COLUMN IF EXISTS "public_cache_epoch";
```

Then remove the migration folder from the release branch if the migration was never applied outside disposable DBs.
