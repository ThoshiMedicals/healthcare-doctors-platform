# Release workflow

Repository: https://github.com/ThoshiMedicals/healthcare-doctors-platform

Work moves in one direction:

```text
fix or chore branch → development → staging → main → annotated tag
```

`development` is where changes are integrated. `staging` is the staff-review copy. `main` is production. A promotion is a merge commit, so it can be reversed with `git revert` without rewriting history.

Nothing in this file deploys the site. Do not push or merge until you choose to run the command yourself.

Cloudflare is used only for DNS, SSL proxying, and traffic management.

The GitHub repository is currently public. Make it private before the first push of the platform source. Settings → General → Danger Zone → Change repository visibility.

## Branches that already exist

`main`, `staging`, and `development` are already on GitHub. All three point at commit `feaeb79`, which contains only a one-line README. This PC has the platform files and no local commits yet, so those three names cannot be moved until the first local commit exists.

Do not run `git push --force`. A force push would discard that GitHub commit and is not required.

## First publication of this folder

Set your Git name and email yourself. This project does not set them.

```powershell
cd C:\Users\RoshanSamarawickrema\Desktop\WMC-Master-Project
git switch -c development
git add -A
git status
git commit -m "chore: add the Woolloongabba platform source"
git fetch origin
git merge origin/main --allow-unrelated-histories -m "chore: join the GitHub initial commit"
```

`git status` must not list `apps/web/.env`, `node_modules`, `.next`, `.pgdata`, `storage`, or `backups`. If the merge stops on `README.md`, keep the local platform guide and finish the merge:

```powershell
git checkout --ours README.md
git add README.md
git commit -m "chore: keep the local platform guide"
```

`--ours` is the local guide because the merge was started from the local commit.

Then publish. These pushes are fast-forwards after the merge above. They are not force pushes.

```powershell
git push -u origin development
git push origin development:staging
git push origin development:main
```

After that, check out the branch you want to work on:

```powershell
git switch development
git branch -u origin/development
git switch -c staging origin/staging
git switch -c main origin/main
git switch development
```

## Day-to-day commands

Start from the latest development branch:

```powershell
git switch development
git pull origin development
git switch -c fix/short-name
```

Commit, then push the short-lived branch:

```powershell
git push -u origin fix/short-name
```

Merge it into development with a merge commit:

```powershell
git switch development
git pull origin development
git merge --no-ff fix/short-name -m "fix: describe the correction"
git push origin development
```

Promote development to staging for staff review:

```powershell
git switch staging
git pull origin staging
git merge --no-ff development -m "chore: promote development to staging"
git push origin staging
```

Promote staging to production only after staff review:

```powershell
git switch main
git pull origin main
git merge --no-ff staging -m "chore: promote staging to production"
git tag -a vX.Y.Z -m "Version X.Y.Z of the Woolloongabba platform."
git push origin main
git push origin vX.Y.Z
```

Replace `vX.Y.Z` with the next annotated tag, starting at `v1.0.0`. Do not move or delete a tag that the server has already checked out.

A hotfix starts from production and then returns to the other two branches:

```powershell
git switch main
git pull origin main
git switch -c hotfix/short-name
# commit the correction
git switch main
git merge --no-ff hotfix/short-name -m "fix: describe the hotfix"
git push origin main
git switch staging
git merge --no-ff main -m "chore: return the hotfix to staging"
git push origin staging
git switch development
git merge --no-ff main -m "chore: return the hotfix to development"
git push origin development
```

## Rollback

Roll back a promotion by reverting its merge commit. Find the SHA with `git log --merges -5`.

```powershell
git switch main
git pull origin main
git revert --no-edit -m 1 MERGE_SHA
git push origin main
git switch staging
git merge --no-ff main -m "chore: roll the revert back to staging"
git push origin staging
git switch development
git merge --no-ff main -m "chore: roll the revert back to development"
git push origin development
```

`-m 1` keeps the production side of the merge and removes the change that was promoted. Do not use `git reset --hard` or `git push --force` on `main`, `staging`, or `development`.

On the VPS, check out the previous annotated tag only after `deployment/backup-database.sh` has stored a package off the server. That package contains the database and the `wmc_images` volume. Restoring the tag does not undo a database migration. If the bad release ran a migration, run `deployment/restore-database.sh` with the package taken before that migration, then complete the Recovery Verification Checklist in `deployment/LAUNCH.md`. Content rollback inside the CMS is a separate action and does not change Git.

## Build check

From `apps/web`, the production command is:

```powershell
npm run build
```

That runs `prisma generate` and `next build`. On 15 October 2026, `next build` completed successfully with Next.js 15.5.27. Routes are server-rendered. The static page is the not-found page. `npm run build` could not replace the Prisma engine DLL while the local development server was running. Stop that server before relying on a full `npm run build` on this PC. Lint reported warnings only. The compile did not fail on them.

The build writes a Node.js standalone server. It is the artifact used by `apps/web/Dockerfile` and `deployment/docker-compose.production.yml`.

## GitHub settings

Protect `development`, `staging`, and `main`:

- Require a pull request before merging.
- Do not allow force pushes.
- Do not allow the branch to be deleted.

Production on the VPS checks out the annotated tag on `main`, not a floating branch tip. DNS cutover follows `deployment/LAUNCH.md`.

Cloudflare is used only for DNS, SSL proxying, and traffic management. Do not create a Cloudflare Pages project.
