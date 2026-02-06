"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createPost } from "@/app/(dashboard)/actions/posts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_SIZE_MB = 4;

type CreatePostFormProps = {
  userId: string;
};

export function CreatePostForm({ userId }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error("Write something to post.");
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
        toast.error(error.message ?? "Image upload failed.");
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
      toast.success("Posted!");
    } else {
      toast.error(result.error);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB}MB`);
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-sm">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-y rounded-xl border-border bg-muted/30 focus-visible:ring-primary/30"
            maxLength={2000}
            disabled={submitting}
          />
          {preview && (
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setPreview(null);
                }}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              >
                ×
              </button>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={onFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => inputRef.current?.click()}
              disabled={submitting}
            >
              Add image
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-primary px-5"
              disabled={submitting || !content.trim()}
            >
              {submitting ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
