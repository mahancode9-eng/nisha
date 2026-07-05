#!/bin/sh
# Nisha - automatic PostgreSQL backup loop.
# Runs inside the db-backup container (postgres:16-alpine).
#
# Environment variables:
#   PGHOST                  database host (default: db)
#   PGUSER                  database user (default: nisha)
#   PGDATABASE              database name (default: nisha)
#   PGPASSWORD              database password (required, injected by compose)
#   BACKUP_DIR              where to write backups (default: /backups)
#   BACKUP_INTERVAL_SECONDS how often to back up (default: 86400 = 24h)
#   BACKUP_RETENTION_DAYS   delete backups older than this (default: 14)
set -eu

: "${PGHOST:=db}"
: "${PGUSER:=nisha}"
: "${PGDATABASE:=nisha}"
: "${BACKUP_DIR:=/backups}"
: "${BACKUP_INTERVAL_SECONDS:=86400}"
: "${BACKUP_RETENTION_DAYS:=14}"

mkdir -p "$BACKUP_DIR"

echo "[db-backup] starting: every ${BACKUP_INTERVAL_SECONDS}s, retention ${BACKUP_RETENTION_DAYS} days"

while true; do
  timestamp="$(date +%Y%m%d-%H%M%S)"
  target="$BACKUP_DIR/nisha-$timestamp.sql.gz"
  echo "[db-backup] creating $target"
  if pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" --clean --if-exists --no-owner --format=plain | gzip > "$target"; then
    echo "[db-backup] done: $target"
  else
    echo "[db-backup] ERROR: pg_dump failed, removing partial file" >&2
    rm -f "$target"
  fi
  # Remove backups older than the retention window.
  find "$BACKUP_DIR" -name 'nisha-*.sql.gz' -mtime "+${BACKUP_RETENTION_DAYS}" -delete 2>/dev/null || true
  sleep "$BACKUP_INTERVAL_SECONDS"
done
