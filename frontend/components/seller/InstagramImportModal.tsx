"use client";

import { useRef, useState } from "react";
import * as productsApi from "@/lib/api/seller/products";
import { uploadPublicImage } from "@/lib/api/public/uploads";
import { moneyInputToNumber, parseMoneyInput } from "@/lib/moneyInput";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Textarea } from "@/components/ui/Textarea";

type InstagramImportModalProps = {
  open: boolean;
  onClose: () => void;
  onImported: (productId: number) => void;
};

export function InstagramImportModal({ open, onClose, onImported }: InstagramImportModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const uploaded = await uploadPublicImage(file);
      setImageUrl(uploaded.url);
      toast.success("عکس آپلود شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "عکس آپلود نشد. دوباره امتحان کن.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!caption.trim()) {
      toast.error("کپشن پست رو بچسبون.");
      return;
    }
    if (!imageUrl.trim()) {
      toast.error("عکس محصول لازمه.");
      return;
    }
    const stockNum = parseInt(stock, 10);
    if (Number.isNaN(stockNum) || stockNum < 0) {
      toast.error("موجودی رو درست بنویس.");
      return;
    }
    let parsedPrice: number | null = null;
    if (parseMoneyInput(price)) {
      parsedPrice = moneyInputToNumber(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        toast.error("قیمت رو درست بنویس.");
        return;
      }
    }
    setSaving(true);
    try {
      const product = await productsApi.importInstagramProduct({
        caption: caption.trim(),
        image_url: imageUrl.trim(),
        price: parsedPrice,
        stock_quantity: stockNum,
      });
      toast.success("محصول از اینستاگرام ساخته شد");
      setCaption("");
      setImageUrl("");
      setPrice("");
      setStock("1");
      onImported(product.id);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "وارد نشد. دوباره امتحان کن.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="ورود از اینستاگرام">
      <div className="space-y-4">
        <Textarea
          label="کپشن پست"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          hint="عنوان و توضیحات محصول از روی کپشن ساخته می‌شه."
        />
        <div className="space-y-2">
          <Input
            label="آدرس عکس"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            dir="ltr"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            آپلود عکس
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyInput label="قیمت (اختیاری)" value={price} onValueChange={setPrice} />
          <Input
            label="موجودی"
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            انصراف
          </Button>
          <Button loading={saving} onClick={() => void handleSubmit()}>
            ساخت محصول
          </Button>
        </div>
      </div>
    </Modal>
  );
}
