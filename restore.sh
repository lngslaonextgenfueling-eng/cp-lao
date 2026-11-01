#!/usr/bin/env bash
# Restore the database from a backup file.   ./restore.sh backups/pcshop-20261101-0300.sql.gz
set -euo pipefail
cd "$(dirname "$0")"
[ -f "${1:-}" ] || { echo "Usage: ./restore.sh backups/<file>.sql.gz"; ls -1t backups | head; exit 1; }
read -rp "⚠️ ຂໍ້ມູນປັດຈຸບັນຈະຖືກແທນທີ່ດ້ວຍ $1. ພິມ YES ເພື່ອຢືນຢັນ: " ok
[ "$ok" = "YES" ] || exit 1
docker compose stop backend
docker compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" --if-exists "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
gunzip -c "$1" | docker compose exec -T db sh -c 'psql -q -U "$POSTGRES_USER" "$POSTGRES_DB"'
docker compose start backend
echo "ກູ້ຂໍ້ມູນສຳເລັດ"
