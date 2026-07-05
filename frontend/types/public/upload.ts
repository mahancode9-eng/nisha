export type MediaUploadResponse = {
  url: string;
  thumbnail_url: string | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  filename: string | null;
};
