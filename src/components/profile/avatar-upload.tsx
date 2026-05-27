"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { cropImageToBlob } from "@/lib/crop-image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_SIZE_MB = 2;

function getInitials(name: string | null, email: string | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

type AvatarUploadProps = {
  userId: string;
  avatarUrl: string | null;
  name: string | null;
  email: string | undefined;
  onUploadComplete: (publicUrl: string) => void;
  className?: string;
};

export function AvatarUpload({
  userId,
  avatarUrl,
  name,
  email,
  onUploadComplete,
  className,
}: AvatarUploadProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("feed.post");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);
  const initials = getInitials(name, email);

  useEffect(() => {
    return () => {
      if (rawSrc) URL.revokeObjectURL(rawSrc);
    };
  }, [rawSrc]);

  const onCropComplete = useCallback((_: Area, px: Area) => {
    setAreaPx(px);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(t("fileTooLarge", { size: MAX_SIZE_MB }));
      e.target.value = "";
      return;
    }
    if (!ACCEPT.split(",").some((mime) => mime.trim() === file.type)) {
      toast.error(t("unsupportedFile"));
      e.target.value = "";
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPx(null);
    setRawSrc(URL.createObjectURL(file));
    // Reset input so picking the same file again still fires onChange
    e.target.value = "";
  }

  function closeDialog() {
    if (rawSrc) URL.revokeObjectURL(rawSrc);
    setRawSrc(null);
    setAreaPx(null);
  }

  async function handleSave() {
    if (!rawSrc || !areaPx) return;
    setUploading(true);
    try {
      const blob = await cropImageToBlob(rawSrc, areaPx);
      const supabase = createClient();
      const path = `${userId}/avatar.jpg`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      onUploadComplete(`${publicUrl}?t=${Date.now()}`);
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Avatar className="size-20">
        <AvatarImage src={avatarUrl ?? undefined} alt={name ?? "Avatar"} />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? t("uploading") : t("changeAvatar")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("avatarHint", { size: MAX_SIZE_MB })}
        </p>
      </div>

      <Dialog open={!!rawSrc} onOpenChange={(o) => !o && !uploading && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("adjustAvatar")}</DialogTitle>
          </DialogHeader>

          <div className="relative h-72 w-full overflow-hidden rounded-md bg-muted">
            {rawSrc && (
              <Cropper
                image={rawSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{t("zoom")}</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary"
              aria-label={t("zoom")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={uploading}
              className="rounded-full"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={uploading || !areaPx}
              className="rounded-full"
            >
              {uploading ? tCommon("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
