"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { createPost } from "@/app/[locale]/(dashboard)/actions/posts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { ImageIcon, X } from "lucide-react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_SIZE_MB = 4;

type CreatePostFormProps = {
  userId: string;
};

function initialsFor(name: string | null | undefined): string {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function CreatePostForm({ userId }: CreatePostFormProps) {
  const t = useTranslations("feed.createPost");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { profile } = useProfile(userId);

  useEffect(() => {
    if (expanded) textareaRef.current?.focus();
  }, [expanded]);

  function collapse() {
    if (submitting) return;
    if (content.trim() || imageFile) return;
    setExpanded(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error(t("writeSomething"));
      return;
    }
    setSubmitting(true);
    let imageUrl: string | null = null;
    if (imageFile) {
      const supabase = createClient();
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("post-images")
        .upload(path, imageFile, { upsert: false });
      if (error) {
        const message =
          error.message?.toLowerCase().includes("bucket") &&
          error.message?.toLowerCase().includes("not found")
            ? t("bucketMissing")
            : error.message ?? t("uploadFailed");
        toast.error(message);
        setSubmitting(false);
        return;
      }
      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }
    const result = await createPost({ content: trimmed, image_url: imageUrl });
    setSubmitting(false);
    if (result.success) {
      setContent("");
      setImageFile(null);
      setPreview(null);
      setExpanded(false);
      toast.success(t("posted"));
    } else {
      toast.error(result.error);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(t("imageTooLarge", { size: MAX_SIZE_MB }));
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setExpanded(true);
  }

  const avatarUrl = profile?.avatar_url ?? undefined;
  const initials = initialsFor(profile?.name);

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onFileChange}
        />

        {!expanded ? (
          <div className="flex items-center gap-3">
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={avatarUrl} alt={profile?.name ?? ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex-1 rounded-full bg-muted/40 px-4 py-2.5 text-start text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              {t("placeholder")}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full shrink-0"
              onClick={() => inputRef.current?.click()}
              aria-label={t("addImage")}
            >
              <ImageIcon className="size-5 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={avatarUrl} alt={profile?.name ?? ""} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <Textarea
                ref={textareaRef}
                placeholder={t("placeholder")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={collapse}
                className="min-h-[100px] flex-1 resize-y rounded-xl border-border bg-muted/30 focus-visible:ring-primary/30"
                maxLength={2000}
                disabled={submitting}
              />
            </div>
            {preview && (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview, not optimizable by next/image */}
                <img
                  src={preview}
                  alt="Preview"
                  className="block max-h-64 w-auto max-w-full rounded-xl object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setPreview(null);
                  }}
                  className="absolute end-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                  aria-label={t("removeImage")}
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => inputRef.current?.click()}
                disabled={submitting}
              >
                <ImageIcon className="size-4 me-1.5" />
                {t("addImage")}
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={submitting || !content.trim()}
              >
                {submitting ? t("posting") : t("post")}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
