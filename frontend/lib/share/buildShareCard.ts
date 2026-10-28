export type ShareCardFormat = "story" | "post";

export type BuildShareCardOptions = {
  title: string;
  priceLabel: string;
  storeName: string;
  imageUrl: string | null;
  format: ShareCardFormat;
  brandColor?: string | null;
  showWatermark?: boolean;
};

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

export async function buildShareCardBlob(
  opts: BuildShareCardOptions,
): Promise<Blob | null> {
  const isStory = opts.format === "story";
  const width = 1080;
  const height = isStory ? 1920 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const brand = opts.brandColor?.trim() || "#3d2a1f";
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#1a1512");
  gradient.addColorStop(1, brand);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const imageSize = isStory ? 900 : 620;
  const imageY = isStory ? 220 : 120;
  if (opts.imageUrl) {
    const img = await loadImage(opts.imageUrl);
    if (img) {
      const x = (width - imageSize) / 2;
      const y = imageY;
      ctx.save();
      const r = 48;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + imageSize, y, x + imageSize, y + imageSize, r);
      ctx.arcTo(x + imageSize, y + imageSize, x, y + imageSize, r);
      ctx.arcTo(x, y + imageSize, x, y, r);
      ctx.arcTo(x, y, x + imageSize, y, r);
      ctx.closePath();
      ctx.clip();
      const scale = Math.max(imageSize / img.width, imageSize / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, x + (imageSize - dw) / 2, y + (imageSize - dh) / 2, dw, dh);
      ctx.restore();
    }
  }

  ctx.fillStyle = "#f5efe6";
  ctx.textAlign = "center";
  ctx.direction = "rtl";
  ctx.font = "600 48px Vazirmatn, Tahoma, sans-serif";
  ctx.fillText(opts.storeName.slice(0, 40), width / 2, isStory ? 160 : 80);

  const titleY = isStory ? 1240 : 820;
  ctx.font = "700 64px Vazirmatn, Tahoma, sans-serif";
  const title = opts.title.length > 42 ? `${opts.title.slice(0, 40)}…` : opts.title;
  wrapText(ctx, title, width / 2, titleY, width - 160, 78);

  ctx.font = "600 56px Vazirmatn, Tahoma, sans-serif";
  ctx.fillStyle = "#e8c9a0";
  ctx.fillText(opts.priceLabel, width / 2, isStory ? 1480 : 960);

  if (opts.showWatermark !== false) {
    ctx.font = "500 36px Vazirmatn, Tahoma, sans-serif";
    ctx.fillStyle = "rgba(245,239,230,0.7)";
    ctx.fillText("نیشا", width / 2, isStory ? 1780 : 1030);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
