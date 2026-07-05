import { apiPostForm } from "@/lib/api/upload";
import type { MediaUploadResponse } from "@/types/public/upload";

export function uploadPublicFile(file: File): Promise<MediaUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiPostForm<MediaUploadResponse>("/api/v1/public/uploads/files", form, false);
}

export function uploadPublicImage(file: File): Promise<MediaUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiPostForm<MediaUploadResponse>("/api/v1/public/uploads/images", form, false);
}
