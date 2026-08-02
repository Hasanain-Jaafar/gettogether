"use client";

import { useState, useRef, useEffect } from "react";
import { Upload as TusUpload } from "tus-js-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { createPost } from "@/app/[locale]/(dashboard)/actions/posts";
import { createBunnyUploadTicket } from "@/app/[locale]/(dashboard)/actions/bunny";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { ImageIcon, Video, Link2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getVideoEmbed } from "@/lib/video-embed";
import { CATEGORY_ICONS, POST_CATEGORIES, type PostCategory } from "@/lib/post-categories";
import { cn } from "@/lib/utils";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime";
const MAX_IMAGE_MB = 4;
const MAX_VIDEO_MB = 8192;

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
  const tCategories = useTranslations("feed.categories");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [showUrlField, setShowUrlField] = useState(false);
  const isVideo = imageFile?.type.startsWith("video/") ?? false;
  const trimmedVideoUrl = videoUrl.trim();
  const videoUrlEmbed = trimmedVideoUrl ? getVideoEmbed(trimmedVideoUrl) : null;
  const videoUrlInvalid = trimmedVideoUrl.length > 0 && !videoUrlEmbed;
  const [category, setCategory] = useState<PostCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { profile } = useProfile(userId);

  useEffect(() => {
    if (expanded) textareaRef.current?.focus();
  }, [expanded]);

  function collapse(e?: React.FocusEvent<HTMLElement>) {
    if (submitting) return;
    if (content.trim() || imageFile || trimmedVideoUrl || showUrlField) return;
    // Don't collapse when focus is moving to another element inside the form
    const next = e?.relatedTarget as Node | null;
    if (next && e?.currentTarget.closest("form")?.contains(next)) return;
    setExpanded(false);
  }

  function uploadVideoToBunny(file: File): Promise<string | null> {
    return createBunnyUploadTicket(file.name).then((ticketResult) => {
      if (!ticketResult.success) {
        toast.error(ticketResult.error);
        return null;
      }
      const { ticket } = ticketResult;
      setUploadProgress(0);
      return new Promise<string | null>((resolve) => {
        const upload = new TusUpload(file, {
          endpoint: ticket.uploadEndpoint,
          retryDelays: [0, 1000, 3000, 5000],
          headers: {
            AuthorizationSignature: ticket.signature,
            AuthorizationExpire: String(ticket.expiration),
            VideoId: ticket.videoId,
            LibraryId: ticket.libraryId,
          },
          metadata: {
            filetype: file.type,
            title: file.name,
          },
          onError: () => {
            toast.error(t("videoUploadFailed"));
            setUploadProgress(null);
            resolve(null);
          },
          onProgress: (bytesSent, bytesTotal) => {
            setUploadProgress(Math.round((bytesSent / bytesTotal) * 100));
          },
          onSuccess: () => {
            setUploadProgress(null);
            resolve(`https://iframe.mediadelivery.net/embed/${ticket.libraryId}/${ticket.videoId}`);
          },
        });
        upload.start();
      });
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && !imageFile && !trimmedVideoUrl) {
      toast.error(t("writeSomething"));
      return;
    }
    if (videoUrlInvalid) {
      toast.error(t("invalidVideoUrl"));
      return;
    }
    if (!category) {
      toast.error(t("categoryRequired"));
      return;
    }
    setSubmitting(true);
    let imageUrl: string | null = null;
    let uploadedVideoUrl: string | null = null;
    let mediaType: "image" | "video" | "gif" | null = null;
    if (imageFile && isVideo) {
      uploadedVideoUrl = await uploadVideoToBunny(imageFile);
      if (!uploadedVideoUrl) {
        setSubmitting(false);
        return;
      }
      mediaType = "video";
    } else if (imageFile) {
      const supabase = createClient();
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("post-images")
        .upload(path, imageFile, {
          upsert: false,
          contentType: imageFile.type || undefined,
        });
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
      mediaType = imageFile.type === "image/gif" ? "gif" : "image";
    }
    const result = await createPost({
      content: trimmed,
      image_url: imageUrl,
      video_url: uploadedVideoUrl ?? trimmedVideoUrl ?? null,
      media_type: mediaType ?? (trimmedVideoUrl ? "video" : null),
      category,
    });
    setSubmitting(false);
    if (result.success) {
      setContent("");
      setImageFile(null);
      setPreview(null);
      setVideoUrl("");
      setShowUrlField(false);
      setCategory(null);
      setExpanded(false);
      toast.success(t("posted"));
    } else {
      toast.error(result.error);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileIsVideo = file.type.startsWith("video/");
    const limit = fileIsVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (file.size > limit * 1024 * 1024) {
      toast.error(
        t(fileIsVideo ? "videoTooLarge" : "imageTooLarge", { size: limit }),
      );
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
      <CardContent className={expanded ? "p-4 sm:p-6" : "p-2"}>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={onFileChange}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept={VIDEO_ACCEPT}
          className="hidden"
          onChange={onFileChange}
        />

        {!expanded ? (
          <div className="flex items-center gap-2">
            <Avatar className="size-7 shrink-0">
              <AvatarImage src={avatarUrl} alt={profile?.name ?? ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex-1 rounded-full border border-border/60 bg-muted/40 px-3.5 py-1.5 text-start text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              {t("placeholder")}
            </button>
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
            <div className="flex flex-wrap gap-2">
              {POST_CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c];
                const selected = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setCategory(c)}
                    disabled={submitting}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {tCategories(c)}
                  </button>
                );
              })}
            </div>
            {(showUrlField || trimmedVideoUrl) && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Input
                    type="url"
                    inputMode="url"
                    placeholder={t("videoUrlPlaceholder")}
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    onBlur={collapse}
                    disabled={submitting}
                    className="rounded-xl"
                    aria-invalid={videoUrlInvalid}
                  />
                  {trimmedVideoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setVideoUrl("");
                        setShowUrlField(false);
                      }}
                      aria-label={t("removeVideoUrl")}
                      className="shrink-0 rounded-full"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
                {videoUrlInvalid && (
                  <p className="text-xs text-destructive">{t("invalidVideoUrl")}</p>
                )}
              </div>
            )}
            {preview && (
              <div className="relative inline-block">
                {isVideo ? (
                  <video
                    src={preview}
                    controls
                    className="block max-h-64 w-auto max-w-full rounded-xl"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element -- blob URL preview, not optimizable by next/image */
                  <img
                    src={preview}
                    alt="Preview"
                    className="block max-h-64 w-auto max-w-full rounded-xl object-contain"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setPreview(null);
                  }}
                  disabled={submitting}
                  className="absolute end-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 disabled:opacity-50"
                  aria-label={t("removeImage")}
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
            {isVideo && uploadProgress !== null && (
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("uploadingVideo", { percent: uploadProgress })}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => inputRef.current?.click()}
                  disabled={submitting}
                >
                  <ImageIcon className="size-4 me-1.5" />
                  {t("addImage")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => videoInputRef.current?.click()}
                  disabled={submitting}
                >
                  <Video className="size-4 me-1.5" />
                  {t("addVideo")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowUrlField((v) => !v)}
                  disabled={submitting}
                  aria-pressed={showUrlField}
                >
                  <Link2 className="size-4 me-1.5" />
                  {t("addVideoUrl")}
                </Button>
              </div>
              <Button
                type="submit"
                onMouseDown={(e) => e.preventDefault()}
                className="rounded-xl sm:w-auto"
                disabled={
                  submitting ||
                  (!content.trim() && !imageFile && !trimmedVideoUrl) ||
                  videoUrlInvalid ||
                  !category
                }
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
