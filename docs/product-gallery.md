# Product Gallery & Video (Roadmap Task 15)

Multi-image product galleries with drag & drop ordering, plus an optional product video.

## What was built

### Backend

- **8-image cap per product.** Enforced in two layers:
  - Pydantic schemas: `images` / `image_urls` lists on `ProductCreate` / `ProductUpdate` accept at most `MAX_PRODUCT_IMAGES = 8` items (`backend/app/schemas/product.py`).
  - Service layer: `_attach_images` (create/replace) and `create_product_image` (add single image) raise a 422 with a Persian message when the cap is exceeded (`backend/app/services/product_service.py`).
- **Product video columns.** `products.video_url` (VARCHAR 500) and `products.video_mime_type` (VARCHAR 100), both nullable — migration `20260706_0013_product_video.py`. Existing single/multi image data is untouched (the `product_images` table already existed), so no data migration is required.
- **Video upload endpoint.** `POST /api/v1/public/uploads/videos` accepts one `file` (multipart):
  - Max size: `MAX_VIDEO_UPLOAD_SIZE_BYTES` setting (default **52,428,800 bytes = 50MB**), separate from the 5MB image/file limit.
  - Allowed formats: **MP4** and **WebM**, validated by magic bytes (`ftyp` box / EBML header) with content-type fallback.
  - Stored via the storage layer (local or S3 — see `docs/object-storage.md`), returns `{ url, mime_type, filename }`.
- **API responses.** `video_url` / `video_mime_type` are included in the seller `ProductResponse` and in public product payloads (store page, product list/search, product detail).

### Frontend

- **Seller product form** (`frontend/components/seller/ProductForm.tsx`):
  - Image cards can be reordered by dragging the handle at the top of each card (HTML5 drag & drop); the up/down buttons remain as a keyboard/mobile-friendly fallback. First image = primary image.
  - "Add image" is disabled at 8 images and a counter shows `n / 8`; the same limit is validated on submit and again server-side.
  - New video section: upload MP4/WebM (client-side 50MB pre-check + server-side enforcement), inline preview, remove button.
- **Public product page** (`ProductPageClient.tsx`):
  - Unified media gallery: all images plus the video (appended as the last item).
  - Mobile **swipe** left/right on the main viewer, previous/next arrows, position indicator, thumbnail strip.
  - **Zoom**: tapping the main image opens a full-screen lightbox showing the original-resolution image (swipe works inside the lightbox too).
  - Video plays inline with native controls (`playsInline`, `preload="metadata"`).

## Configuration

| Setting | Default | Purpose |
| --- | --- | --- |
| `MAX_UPLOAD_SIZE_BYTES` | `5242880` (5MB) | Images and generic files |
| `MAX_VIDEO_UPLOAD_SIZE_BYTES` | `52428800` (50MB) | Product videos |

## Operations — IMPORTANT

If you run behind Nginx (or any reverse proxy), the default request body limit (1MB in Nginx) will reject video uploads with **HTTP 413** before they reach the backend. Raise it for the API location:

```nginx
location /api/ {
    client_max_body_size 60m;
    # ... existing proxy_pass config
}
```

If uploads go to S3-compatible storage, no bucket change is needed — videos are stored under the same `media/` prefix as images.

## Tests

`backend/tests/test_product_gallery.py`:

- create product with 8 images succeeds, with 9 fails (422)
- adding a 9th image via `POST /seller/products/{id}/images` fails (422)
- `video_url`/`video_mime_type` round-trip through seller create and public product detail
- `POST /public/uploads/videos` accepts an MP4 (magic bytes) and rejects a non-video file
