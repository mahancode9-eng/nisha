# Database & files backup / restore

Production deployments (`docker-compose.prod.yml`) include a `db-backup`
service that automatically backs up both the PostgreSQL database and the
uploaded files (product images, payment proofs).

## How it works

Every `BACKUP_INTERVAL_SECONDS` (default: `86400` = 24h) the service writes
two files to the `./backups` directory on the host:

```
backups/nisha-YYYYMMDD-HHMMSS.sql.gz      # pg_dump --clean --if-exists (gzip)
backups/uploads-YYYYMMDD-HHMMSS.tar.gz    # archive of the uploads volume
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

## Restoring the database

```bash
./scripts/db-restore.sh backups/nisha-YYYYMMDD-HHMMSS.sql.gz
```

The restore overwrites the current database (the dump includes `DROP ... IF
EXISTS` statements), so only run it when you really want to roll back.

## Restoring uploaded files

```bash
docker compose -f docker-compose.prod.yml run --rm \
  -v "$(pwd)/backups:/backups:ro" db-backup \
  sh -c 'rm -rf /uploads/* && tar -xzf /backups/uploads-YYYYMMDD-HHMMSS.tar.gz -C /uploads'
```

> Note: the `db-backup` service mounts the uploads volume read-only during
> normal operation; the command above runs a one-off container. If it fails
> because of the read-only mount, temporarily remove `:ro` from the
> `backend_uploads:/uploads:ro` line, restore, then revert.

## Off-site copies (recommended)

The `./backups` directory lives on the host server. For real disaster
recovery, periodically copy it to another machine or object storage, e.g.:

```bash
rsync -av backups/ user@other-server:/srv/nisha-backups/
```
