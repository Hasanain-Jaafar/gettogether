import Image from "next/image";
import { Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getVideoEmbed } from "@/lib/video-embed";
import { CATEGORY_COLORS, isPostCategory } from "@/lib/post-categories";
import { cn } from "@/lib/utils";

export type PostGridItem = {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  category?: string | null;
};

const VIDEO_FILE = /\.(mp4|webm|mov|m4v)(\?|$)/i;

// Thumbnail for a pasted/uploaded video link, when one can be derived from the URL.
function videoThumbnail(videoUrl: string): string | null {
  const embed = getVideoEmbed(videoUrl);
  if (!embed) return null;
  if (embed.kind === "youtube") {
    const id = new URL(embed.embedSrc).pathname.split("/").pop();
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  }
  if (embed.kind === "iframe") {
    // Bunny Stream: /embed/{libraryId}/{videoId}. The CDN only serves thumbnails to
    // referrers allowed in the library's security settings, so the tile keeps a
    // fallback underneath in case the image is refused.
    const host = process.env.BUNNY_STREAM_CDN_HOSTNAME;
    const match = new URL(embed.embedSrc).pathname.match(/^\/(?:embed|play)\/[^/]+\/([^/?#]+)/);
    return host && match ? `https://${host}/${match[1]}/thumbnail.jpg` : null;
  }
  return null;
}

/** Instagram-style 3-column grid of square post thumbnails; each tile opens the post. */
export function PostGrid({ posts }: { posts: PostGridItem[] }) {
  return (
    <ul className="grid grid-cols-3 gap-1">
      {posts.map((post) => {
        const isVideoFile = !!post.image_url && VIDEO_FILE.test(post.image_url);
        const image = post.image_url && !isVideoFile ? post.image_url : null;
        const isVideo = isVideoFile || !!post.video_url;
        const thumb = !image && post.video_url ? videoThumbnail(post.video_url) : null;
        const category = isPostCategory(post.category) ? post.category : null;

        return (
          <li key={post.id}>
            <Link
              href={`/post/${post.id}`}
              aria-label={post.content.slice(0, 80) || undefined}
              className="relative block aspect-square overflow-hidden rounded-md bg-muted"
            >
              {image ? (
                <Image src={image} alt="" fill sizes="33vw" className="object-cover" />
              ) : isVideo ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary/25 to-primary/5">
                    <Play className="size-7 fill-primary/60 text-primary/60" />
                  </div>
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element -- external video thumbnail; falls back to the tile underneath if refused
                    <img src={thumb} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                  )}
                </>
              ) : (
                <p
                  className={cn(
                    "size-full whitespace-pre-wrap break-words p-2 text-xs leading-snug line-clamp-6",
                    category ? CATEGORY_COLORS[category] : "text-foreground",
                  )}
                >
                  {post.content}
                </p>
              )}
              {isVideo && (image || thumb) && (
                <Play className="absolute end-1.5 top-1.5 size-4 fill-white text-white drop-shadow" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
