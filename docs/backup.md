# Database backup & restore

Production deployments (`docker-compose.prod.yml`) include a `db-backup` service
that automatically backs up the PostgreSQL database.

## How it works

- Every `BACKUP_INTERVAL_SECONDS` (default: `86400` = 24h) the service runs
  `pg_dump --clean --if-exists` and writes a gzip-compressed SQL file to the
  `./backups` directory on the host:

  ```
  backups/nisha-YYYYMMDD-HHMMSS.sql.gz
  ```

- Backups older than `BACKUP_RETENTION_DAYS` (default: `14`) are deleted
  automatically after each run.
- The first backup is taken as soon as the service starts, so you always have
  a fresh backup right after each deploy.

## Configuration

Set these in the same environment/`.env` used by `docker compose`:

| Variable | Default | Description |
| --- | --- | --- |
| `BACKUP_INTERVAL_SECONDS` | `86400` | Seconds between backups |
| `BACKUP_RETENTION_DAYS` | `14` | Days to keep old backups |

## Checking backup status

```bash
docker compose -f docker-compose.prod.yml logs db-backup
ls -lh backups/
```

## Restoring a backup

```bash
./scripts/db-restore.sh backups/nisha-YYYYMMDD-HHMMSS.sql.gz
```

The restore overwrites the current database (the dump includes `DROP ... IF
EXISTS` statements), so only run it when you really want to roll back.

## Off-site copies (recommended)

The `./backups` directory lives on the host server. For real disaster
recovery, periodically copy it to another machine or object storage, e.g.:

```bash
rsync -av backups/ user@other-server:/srv/nisha-backups/
```
