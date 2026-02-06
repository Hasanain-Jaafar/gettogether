"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const initials = getInitials(name, email);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_SIZE_MB}MB`);
      return;
    }
    const type = file.type as string;
    if (!ACCEPT.split(",").some((t) => t.trim() === type)) return;

    setUploading(true);
    setPreview(URL.createObjectURL(file));
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
      });

    if (error) {
      setPreview(null);
      setUploading(false);
      toast.error(error.message ?? "Upload failed.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    onUploadComplete(publicUrl);
    setUploading(false);
  }

  const displayUrl = preview || avatarUrl;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Avatar className="size-20">
        <AvatarImage src={displayUrl ?? undefined} alt={name ?? "Avatar"} />
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
          {uploading ? "Uploading…" : "Change avatar"}
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP or GIF. Max {MAX_SIZE_MB}MB.
        </p>
      </div>
    </div>
  );
}
