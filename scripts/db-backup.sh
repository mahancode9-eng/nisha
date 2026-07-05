#!/bin/sh
# Nisha - automatic PostgreSQL + uploads backup loop.
# Runs inside the db-backup container (postgres:16-alpine).
#
# Environment variables:
#   PGHOST                  database host (default: db)
#   PGUSER                  database user (default: nisha)
#   PGDATABASE              database name (default: nisha)
#   PGPASSWORD              database password (required, injected by compose)
#   BACKUP_DIR              where to write backups (default: /backups)
#   UPLOADS_DIR             uploaded files dir to back up (default: /uploads)
#   BACKUP_INTERVAL_SECONDS how often to back up (default: 86400 = 24h)
#   BACKUP_RETENTION_DAYS   delete backups older than this (default: 14)
set -eu

: "${PGHOST:=db}"
: "${PGUSER:=nisha}"
: "${PGDATABASE:=nisha}"
: "${BACKUP_DIR:=/backups}"
: "${UPLOADS_DIR:=/uploads}"
: "${BACKUP_INTERVAL_SECONDS:=86400}"
: "${BACKUP_RETENTION_DAYS:=14}"

mkdir -p "$BACKUP_DIR"

echo "[db-backup] starting: every ${BACKUP_INTERVAL_SECONDS}s, retention ${BACKUP_RETENTION_DAYS} days"

while true; do
  timestamp="$(date +%Y%m%d-%H%M%S)"

  # 1) Database dump
  db_target="$BACKUP_DIR/nisha-$timestamp.sql.gz"
  echo "[db-backup] creating $db_target"
  if pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" --clean --if-exists --no-owner --format=plain | gzip > "$db_target"; then
    echo "[db-backup] database dump done: $db_target"
  else
    echo "[db-backup] ERROR: pg_dump failed, removing partial file" >&2
    rm -f "$db_target"
  fi

  # 2) Uploaded files archive (product images, payment proofs, ...)
  if [ -d "$UPLOADS_DIR" ]; then
    files_target="$BACKUP_DIR/uploads-$timestamp.tar.gz"
    echo "[db-backup] creating $files_target"
    if tar -czf "$files_target" -C "$UPLOADS_DIR" .; then
      echo "[db-backup] uploads archive done: $files_target"
    else
      echo "[db-backup] ERROR: uploads archive failed, removing partial file" >&2
      rm -f "$files_target"
    fi
  else
    echo "[db-backup] uploads dir $UPLOADS_DIR not found, skipping files backup"
  fi

  # 3) Remove backups older than the retention window.
  find "$BACKUP_DIR" -name 'nisha-*.sql.gz' -mtime "+${BACKUP_RETENTION_DAYS}" -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime "+${BACKUP_RETENTION_DAYS}" -delete 2>/dev/null || true

  sleep "$BACKUP_INTERVAL_SECONDS"
done
