# Object Storage

Uploaded files (product images, thumbnails, payment proofs) can be stored
either on the local disk (default) or in any **S3-compatible** object storage.
The backend is selected with the `STORAGE_BACKEND` environment variable - no
code changes are needed to switch.

## Backends

| `STORAGE_BACKEND` | Where files go                          | Public URL              |
| ----------------- | --------------------------------------- | ----------------------- |
| `local` (default) | `UPLOAD_DIR` on the server disk         | `/uploads/...` (served by the API) |
| `s3`              | An S3-compatible bucket                 | Bucket / CDN URL        |

## S3 configuration

| Variable               | Required | Description                                            |
| ---------------------- | -------- | ------------------------------------------------------ |
| `S3_BUCKET`            | yes      | Bucket name (must allow public read for uploaded keys) |
| `S3_ACCESS_KEY_ID`     | yes      | Access key                                             |
| `S3_SECRET_ACCESS_KEY` | yes      | Secret key                                             |
| `S3_ENDPOINT_URL`      | for non-AWS | Provider endpoint, e.g. ArvanCloud/Liara/MinIO      |
| `S3_REGION`            | for AWS  | AWS region (ignored by most Iranian providers)         |
| `S3_PUBLIC_BASE_URL`   | no       | CDN or custom domain to build public URLs from         |

### Provider notes

- **ArvanCloud**: create a bucket in the Object Storage panel, enable public
  read access, and use the endpoint shown in the panel (e.g.
  `https://s3.ir-thr-at1.arvanstorage.ir`).
- **Liara**: create a bucket with public access in the console and use the
  endpoint from the bucket settings page.
- **Amazon S3**: leave `S3_ENDPOINT_URL` empty and set `S3_REGION`.
- If you put a CDN in front of the bucket, set `S3_PUBLIC_BASE_URL` to the CDN
  domain so stored URLs go through the CDN.

## Behavior details

- With `local`, URLs stored in the database are relative (`/uploads/...`).
  With `s3`, URLs are absolute (`https://...`). Both are stored as plain
  strings, so switching backends only affects **new** uploads - existing rows
  keep working as long as the old files stay where they were.
- To migrate existing local files to the bucket, sync the uploads volume once
  (e.g. with `rclone` or the provider's CLI) while keeping the same key
  structure (`<subdir>/<filename>`), then update old DB URLs if desired.
- When `s3` is active, the `db-backup` service still backs up the local
  uploads volume; bucket contents should be protected with the provider's
  versioning/replication features instead.
- If the frontend uses `next/image` for these images, add the bucket/CDN
  domain to `images.remotePatterns` in `frontend/next.config.ts`.
