#!/bin/sh
# Restores one package created by backup-database.sh.
# Stops the application, loads the dump into an empty database, replaces the
# image volume, starts the application, and checks /api/health.
# Usage: sh deployment/restore-database.sh deployment/backups/<stamp>
set -eu
if [ "$#" -ne 1 ]; then
  echo "Usage: sh deployment/restore-database.sh deployment/backups/<stamp>" >&2
  exit 1
fi

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
backup=$(CDPATH= cd -- "$1" && pwd)
user=${POSTGRES_USER:-wmc}
db=${POSTGRES_DB:-wmc}
compose="docker compose -f deployment/docker-compose.production.yml"

case "$user" in
  *[!A-Za-z0-9_]*) echo "POSTGRES_USER must contain only letters, numbers, and underscores." >&2; exit 1 ;;
esac
case "$db" in
  *[!A-Za-z0-9_]*) echo "POSTGRES_DB must contain only letters, numbers, and underscores." >&2; exit 1 ;;
esac

for required in database.sql images.tar.gz backup-manifest.txt; do
  if [ ! -f "$backup/$required" ]; then
    echo "That folder is not a backup package. Missing ${required}." >&2
    exit 1
  fi
done

echo "Stopping the web and nginx containers."
$compose stop web nginx
$compose up -d --wait postgres

echo "Replacing database ${db} with an empty database."
$compose exec -T postgres psql -U "$user" -d postgres -v ON_ERROR_STOP=1 \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${db}' AND pid <> pg_backend_pid();"
$compose exec -T postgres psql -U "$user" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"${db}\";"
$compose exec -T postgres psql -U "$user" -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"${db}\" OWNER \"${user}\";"
$compose exec -T postgres psql -U "$user" -d "$db" -v ON_ERROR_STOP=1 < "$backup/database.sql"

echo "Replacing the wmc_images volume."
$compose run -T --rm --no-deps --no-build \
  -v "$backup:/restore:ro" \
  --entrypoint sh web -c \
  'for item in /app/storage/* /app/storage/.[!.]* /app/storage/..?*; do [ -e "$item" ] && rm -rf "$item"; done; tar xzf /restore/images.tar.gz -C /app/storage'

echo "Starting the application."
$compose up -d web nginx

attempt=0
until $compose exec -T web node -e 'fetch("http://127.0.0.1:3000/api/health").then(async (response) => { const body = await response.text(); if (!response.ok || !body.includes("\"database\":\"up\"")) process.exit(1); }).catch(() => process.exit(1))'; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "The containers started, but /api/health did not report the database up." >&2
    echo "Complete the Recovery Verification Checklist in deployment/LAUNCH.md before using the site." >&2
    exit 1
  fi
  sleep 2
done

echo "Health check passed for ${backup}."
echo "Complete the Recovery Verification Checklist in deployment/LAUNCH.md."
