#!/bin/sh
# Nisha - restore a database backup created by scripts/db-backup.sh.
#
# Usage:
#   ./scripts/db-restore.sh backups/nisha-YYYYMMDD-HHMMSS.sql.gz
#
# Notes:
# - Backups are created with pg_dump --clean --if-exists, so restoring
#   drops and recreates the objects in the target database.
# - Run this from the repository root (where docker-compose.prod.yml lives).
set -eu

if [ $# -ne 1 ]; then
  echo "Usage: $0 <backup-file.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

echo "WARNING: this will OVERWRITE the current 'nisha' database with:"
echo "  $BACKUP_FILE"
echo "Press Ctrl+C within 5 seconds to cancel..."
sleep 5

gunzip -c "$BACKUP_FILE" | docker compose -f docker-compose.prod.yml exec -T db psql -U nisha -d nisha

echo "Restore completed successfully."
