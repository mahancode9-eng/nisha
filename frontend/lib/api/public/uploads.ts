import { apiPostForm } from "@/lib/api/upload";
import type { MediaUploadResponse } from "@/types/public/upload";

export function uploadPublicFile(file: File): Promise<MediaUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiPostForm<MediaUploadResponse>("/api/v1/public/uploads/files", form, true);
}

export function uploadPublicImage(file: File): Promise<MediaUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiPostForm<MediaUploadResponse>("/api/v1/public/uploads/images", form, true);
}

export function uploadPublicVideo(file: File): Promise<MediaUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiPostForm<MediaUploadResponse>("/api/v1/public/uploads/videos", form, true);
}

export function uploadGuestFile(file: File): Promise<MediaUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiPostForm<MediaUploadResponse>("/api/v1/public/uploads/guest/files", form, false);
}

export function uploadGuestImage(file: File): Promise<MediaUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiPostForm<MediaUploadResponse>("/api/v1/public/uploads/guest/images", form, false);
}
