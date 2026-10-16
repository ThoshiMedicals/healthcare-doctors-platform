#!/bin/sh
# One VPS backup package: PostgreSQL plus every file in the wmc_images volume.
# Run from the repository root: sh deployment/backup-database.sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"

stamp=$(date -u +%Y%m%dT%H%M%SZ)
dest="deployment/backups/${stamp}"
user=${POSTGRES_USER:-wmc}
db=${POSTGRES_DB:-wmc}
compose="docker compose -f deployment/docker-compose.production.yml"

case "$user" in
  *[!A-Za-z0-9_]*) echo "POSTGRES_USER must contain only letters, numbers, and underscores." >&2; exit 1 ;;
esac
case "$db" in
  *[!A-Za-z0-9_]*) echo "POSTGRES_DB must contain only letters, numbers, and underscores." >&2; exit 1 ;;
esac

mkdir -p "$dest"
$compose up -d --wait postgres

$compose exec -T postgres \
  pg_dump -U "$user" -d "$db" --no-owner --no-acl > "$dest/database.sql"

# The volume is mounted at /app/storage. It holds uploaded logo, hero, exterior,
# practitioner replacements, governance image bytes, pending files, and archives.
$compose run -T --rm --no-deps --no-build --entrypoint tar web \
  czf - -C /app/storage . > "$dest/images.tar.gz"

{
  echo "created_utc=${stamp}"
  echo "database_name=${db}"
  echo "database_file=database.sql"
  echo "images_file=images.tar.gz"
  echo "image_volume=wmc_images"
  echo "image_path=/app/storage"
  echo "includes=postgresql,uploaded-logo,uploaded-hero,uploaded-exterior,practitioner-replacements,governance-image-bytes,wmc_images"
  echo "original_public_files=not-included-they-remain-in-git-and-the-web-image"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$dest/database.sql" "$dest/images.tar.gz" | while read -r sum path; do
      name=${path##*/}
      echo "sha256_${name}=${sum}"
    done
  fi
} > "$dest/backup-manifest.txt"

echo "$dest"
