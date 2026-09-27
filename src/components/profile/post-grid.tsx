import Image from "next/image";
import { Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getVideoEmbed, videoKey } from "@/lib/video-embed";
import { CATEGORY_COLORS, isPostCategory } from "@/lib/post-categories";
import { cn } from "@/lib/utils";
import { VideoFrameThumb } from "@/components/profile/video-frame-thumb";

export type PostGridItem = {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  category?: string | null;
};

const VIDEO_FILE = /\.(mp4|webm|mov|m4v)(\?|$)/i;

/** True when the post carries a video (a video link, or a video file stored as its media). */
export function isVideoPost(post: Pick<PostGridItem, "image_url" | "video_url">): boolean {
  return !!post.video_url || (!!post.image_url && VIDEO_FILE.test(post.image_url));
}

/** Identity of the post's video (see videoKey), or null when the post has no video. */
export function postVideoKey(post: Pick<PostGridItem, "image_url" | "video_url">): string | null {
  if (post.video_url) return videoKey(post.video_url);
  if (post.image_url && VIDEO_FILE.test(post.image_url)) return videoKey(post.image_url);
  return null;
}

type VideoThumb = { kind: "image"; src: string } | { kind: "frame"; src: string };

// How to preview a post's video: a thumbnail image when the host provides one,
// otherwise the first frame of a direct video file (e.g. Bunny Storage links).
function videoThumbnail(videoUrl: string): VideoThumb | null {
  const embed = getVideoEmbed(videoUrl);
  if (!embed) return null;
  if (embed.kind === "direct") return { kind: "frame", src: embed.src };
  if (embed.kind === "youtube") {
    const id = new URL(embed.embedSrc).pathname.split("/").pop();
    return id ? { kind: "image", src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` } : null;
  }
  if (embed.kind === "iframe") {
    // Bunny Stream: /embed/{libraryId}/{videoId}. The CDN only serves thumbnails to
    // referrers allowed in the library's security settings, so the tile keeps a
    // fallback underneath in case the image is refused.
    const host = process.env.BUNNY_STREAM_CDN_HOSTNAME;
    const match = new URL(embed.embedSrc).pathname.match(/^\/(?:embed|play)\/[^/]+\/([^/?#]+)/);
    return host && match ? { kind: "image", src: `https://${host}/${match[1]}/thumbnail.jpg` } : null;
  }
  return null;
}

/**
 * Instagram-style 3-column grid of square post thumbnails; each tile opens the post.
 * `returnTo` is the page the grid is on, so the post page can send the user back there
 * (its back link, and after deleting the post).
 */
export function PostGrid({ posts, returnTo }: { posts: PostGridItem[]; returnTo?: string }) {
  return (
    <ul className="grid grid-cols-3 gap-1">
      {posts.map((post) => {
        const isVideoFile = !!post.image_url && VIDEO_FILE.test(post.image_url);
        const image = post.image_url && !isVideoFile ? post.image_url : null;
        const isVideo = isVideoPost(post);
        const thumb: VideoThumb | null = image
          ? null
          : isVideoFile && post.image_url
            ? { kind: "frame", src: post.image_url }
            : post.video_url
              ? videoThumbnail(post.video_url)
              : null;
        const category = isPostCategory(post.category) ? post.category : null;

        return (
          <li key={post.id}>
            <Link
              href={returnTo ? `/post/${post.id}?returnTo=${encodeURIComponent(returnTo)}` : `/post/${post.id}`}
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
                  {thumb?.kind === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element -- external video thumbnail; falls back to the tile underneath if refused
                    <img src={thumb.src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                  )}
                  {thumb?.kind === "frame" && <VideoFrameThumb src={thumb.src} />}
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
