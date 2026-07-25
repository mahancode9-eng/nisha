#!/bin/sh
# Nisha - automatic PostgreSQL + uploads + private_uploads backup loop.
# Runs inside the db-backup container (postgres:16-alpine).
#
# Environment variables:
#   PGHOST                  database host (default: db)
#   PGUSER                  database user (default: nisha)
#   PGDATABASE              database name (default: nisha)
#   PGPASSWORD              database password (required, injected by compose)
#   BACKUP_DIR              where to write backups (default: /backups)
#   UPLOADS_DIR             public uploaded files dir (default: /uploads)
#   PRIVATE_UPLOADS_DIR     private proofs dir (default: /private_uploads)
#   BACKUP_INTERVAL_SECONDS how often to back up (default: 86400 = 24h)
#   BACKUP_RETENTION_DAYS   delete backups older than this (default: 14)
set -eu

: "${PGHOST:=db}"
: "${PGUSER:=nisha}"
: "${PGDATABASE:=nisha}"
: "${BACKUP_DIR:=/backups}"
: "${UPLOADS_DIR:=/uploads}"
: "${PRIVATE_UPLOADS_DIR:=/private_uploads}"
: "${BACKUP_INTERVAL_SECONDS:=86400}"
: "${BACKUP_RETENTION_DAYS:=14}"

mkdir -p "$BACKUP_DIR"

echo "[db-backup] starting: every ${BACKUP_INTERVAL_SECONDS}s, retention ${BACKUP_RETENTION_DAYS} days"

archive_dir() {
  src_dir="$1"
  label="$2"
  target="$3"
  if [ -d "$src_dir" ]; then
    echo "[db-backup] creating $target"
    if tar -czf "$target" -C "$src_dir" .; then
      echo "[db-backup] $label archive done: $target"
    else
      echo "[db-backup] ERROR: $label archive failed, removing partial file" >&2
      rm -f "$target"
    fi
  else
    echo "[db-backup] $label dir $src_dir not found, skipping"
  fi
}

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

  # 2) Public uploads (product images, etc.)
  archive_dir "$UPLOADS_DIR" "uploads" "$BACKUP_DIR/uploads-$timestamp.tar.gz"

  # 3) Private uploads (payment / subscription proofs)
  archive_dir "$PRIVATE_UPLOADS_DIR" "private_uploads" "$BACKUP_DIR/private_uploads-$timestamp.tar.gz"

  # 4) Remove backups older than the retention window.
  find "$BACKUP_DIR" -name 'nisha-*.sql.gz' -mtime "+${BACKUP_RETENTION_DAYS}" -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime "+${BACKUP_RETENTION_DAYS}" -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name 'private_uploads-*.tar.gz' -mtime "+${BACKUP_RETENTION_DAYS}" -delete 2>/dev/null || true

  sleep "$BACKUP_INTERVAL_SECONDS"
done
