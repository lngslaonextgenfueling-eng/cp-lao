#!/usr/bin/env bash
# Pull the latest code and rebuild. Takes a backup first.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p backups
f="backups/pre-update-$(date +%Y%m%d-%H%M).sql.gz"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$f"
echo "backup: $f"
git pull --ff-only
docker compose up -d --build
docker image prune -f >/dev/null
echo "ອັບເດດສຳເລັດ"
