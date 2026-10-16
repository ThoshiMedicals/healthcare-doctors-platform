# Source control

Private GitHub repository for the Woolloongabba Medical Centre platform. This file is the branch, commit, tag, and Version 1.0 rule. It does not change the public website.

GitHub stores source. It does not store the live database, image replacements, or `apps/web/.env`. Those stay in the local backup under the user profile, `WMC-Backups`, and later in an off-VPS copy of the production dump.

## Branch strategy

Long-lived branches are `development`, `staging`, and `main`. Direct pushes to those three are off. Promotion uses a merge commit so it can be reverted. The commands are in `deployment/RELEASE-WORKFLOW.md`.

| Branch | Role | Receives |
| --- | --- | --- |
| `development` | Integration | Short-lived `fix/` and `chore/` branches |
| `staging` | Staff review | A merge from `development` |
| `main` | Production | A merge from `staging`, then an annotated tag |

| Branch | Cut from | Merged to | Lifetime |
| --- | --- | --- | --- |
| `fix/<short-name>` | `development` | `development` | One defect. Delete after merge. |
| `chore/<short-name>` | `development` | `development` | Docs, ignore rules, or deployment packaging. Delete after merge. |
| `hotfix/<short-name>` | `main` | `main`, then back into `staging` and `development` | An urgent correction to a tag already on the VPS. |

Do not create `content` or per-doctor branches. Page text, governance, and image replacements live in PostgreSQL, not in a branch.

`old-html/` stays frozen. A pull request that edits it does not merge unless a written exception names the file and the reason.

## Commit convention

```text
<type>: <imperative summary>
```

Types: `feat`, `fix`, `docs`, `test`, `chore`, `revert`.

Examples:

```text
fix: keep published clinic hours when a draft is restored
docs: record the Version 1.0 tag checklist
chore: ignore local environment files
```

- One purpose per commit.
- The summary says why the change exists, in the present tense, under about 72 characters.
- No passwords, `AUTH_SECRET` values, database URLs with passwords, patient details, or staff names in the message.
- Do not commit `.env`, `node_modules`, `.next`, `.pgdata`, `storage`, `backups`, `logs`, `tmp`, `coverage`, or `__pycache__`.
- A `revert` commit names the commit it undoes.

## Tagging convention

Annotated tags only. Lightweight tags are not releases.

```text
vMAJOR.MINOR.PATCH
```

| Bump | When |
| --- | --- |
| `PATCH` | A correction that does not change public HTML, navigation, or the CMS workflow. |
| `MINOR` | A CMS, image, or deployment change that leaves the approved public layout in place. |
| `MAJOR` | Only after a written decision. The approved public site is frozen, so a major bump is rare. |

The first release is `v1.0.0`. The next correction is `v1.0.1`. Set `apps/web/package.json` `version` to the same number in the commit that the tag points at.

```sh
git tag -a v1.0.0 -m "Version 1.0 source release of the Woolloongabba platform."
git push origin v1.0.0
```

A tag that has been checked out on the VPS is never moved or deleted. The next correction gets a new tag.

## Version 1.0 release plan

`v1.0.0` is the first source snapshot that the VPS may check out for staging. The tag does not move DNS and does not approve production cutover. Production follows `deployment/LAUNCH.md`.

### Before the first commit

1. Confirm `apps/web/.env` and `deployment/.env` are ignored. Commit the example files only.
2. Confirm no temporary script, `node_modules`, `.next`, `.pgdata`, `storage`, `backups`, or `__pycache__` is staged.
3. Keep the local backup at `WMC-Backups`. Take a fresh copy with `deployment/backup-local.ps1` if the database has changed since `20261015T143108`.

### First commit and tag

1. Create the private GitHub repository. Do not make it public.
2. Commit the current tree on `main` with `chore: add the Woolloongabba platform source`.
3. From `apps/web`, run `npm test`. The tag waits until the suite passes.
4. Set `apps/web/package.json` `version` to `1.0.0`.
5. Tag `v1.0.0` on that commit and push `main` and the tag.

### Tag checklist

- [ ] Private repository, protected `main`, pull requests required.
- [ ] `npm test` passed on the tagged commit.
- [ ] Package version is `1.0.0`.
- [ ] Fresh local backup exists and is not in git.
- [ ] Staging will clone the tag, not an untagged branch tip.
- [ ] `LAUNCH.md` staging checklist is still open. DNS stays on the current site.

## Deployment files in the repository

| File | Use |
| --- | --- |
| `deployment/docker-compose.yml` | Local Docker only. It publishes port 5432 with the local password. Do not use it on the VPS. |
| `deployment/docker-compose.production.yml` | VPS stack. Postgres is not published. Image replacements use the `wmc_images` volume. |
| `deployment/nginx/` | HTTP and TLS examples. The app does not load the WordPress redirect CSVs. |
| `deployment/smoke-test.sh` | Staging check through `curl --resolve` while public DNS still shows the current site. |
| `deployment/LAUNCH.md` | The only production deployment guide. |
| `deployment/HOSTINGER.md` | Superseded. Do not use. |
| `deployment/backup-local.ps1` | Windows source, database, and image copy. |
| `deployment/restore-local.ps1` | Local recovery. |
| `deployment/backup-database.sh` | VPS package with `database.sql`, `images.tar.gz`, and `backup-manifest.txt`. Copy the directory off the VPS. |
| `deployment/restore-database.sh` | Stops the app, restores into an empty database, restores `wmc_images`, and checks health. |
| `deployment/RELEASE-WORKFLOW.md` | Branch promotion, push, merge, and rollback. |

## Backup and recovery

Local backup stops PostgreSQL, copies `.pgdata`, image files when they exist, and the source tree, then starts PostgreSQL again. The copy includes `apps/web/.env`. Retention is 14 stamp folders. The destination is outside the repository.

Local recovery:

```powershell
# Stop the website first.
powershell -File deployment\restore-local.ps1 -Backup "$env:USERPROFILE\WMC-Backups\<stamp>"
# Add -IncludeSource only when the project files must be replaced as well.
```

VPS recovery after a tag exists:

1. Run `deployment/backup-database.sh` and copy the package off the VPS before deploying. It includes the database and the `wmc_images` volume.
2. Check out the tag to deploy: `git fetch --tags && git checkout v1.0.0`.
3. To return to the previous release, check out the previous tag and run `deployment/restore-database.sh` with the package taken before the newer migration. Then complete the Recovery Verification Checklist in `LAUNCH.md`.
4. Content rollback inside the CMS restores a revision. It is not a git operation.
5. Cloudflare DNS rollback restores the saved proxied records, as written in `LAUNCH.md`.

The daily Windows scheduled task is not registered yet. Register it only when an operator chooses to. Until then, run `deployment/backup-local.ps1` by hand before a tag and before any restore test.
