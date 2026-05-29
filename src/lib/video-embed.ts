export type VideoEmbed =
  | { kind: "youtube"; embedSrc: string }
  | { kind: "tiktok"; embedSrc: string }
  | { kind: "iframe"; embedSrc: string }
  | { kind: "direct"; src: string }
  | { kind: "link"; href: string };

export function getVideoEmbed(rawUrl: string): VideoEmbed | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  // YouTube
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    if (id) return { kind: "youtube", embedSrc: `https://www.youtube.com/embed/${id}` };
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v) return { kind: "youtube", embedSrc: `https://www.youtube.com/embed/${v}` };
    const shortsMatch = url.pathname.match(/^\/shorts\/([^/?#]+)/);
    if (shortsMatch) return { kind: "youtube", embedSrc: `https://www.youtube.com/embed/${shortsMatch[1]}` };
    const embedMatch = url.pathname.match(/^\/embed\/([^/?#]+)/);
    if (embedMatch) return { kind: "youtube", embedSrc: `https://www.youtube.com/embed/${embedMatch[1]}` };
  }

  // TikTok
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    const m = url.pathname.match(/\/video\/(\d+)/);
    if (m) {
      const params = "music_info=0&description=0&closed_caption=0&native_context_menu=0";
      return { kind: "tiktok", embedSrc: `https://www.tiktok.com/player/v1/${m[1]}?${params}` };
    }
    // vm.tiktok.com / vt.tiktok.com short links — fall through to plain link (we can't resolve them client-side)
  }

  // Bunny Stream embed (iframe player)
  // Official format: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
  // Some accounts/regions use player.mediadelivery.net — accept both.
  if (host === "iframe.mediadelivery.net" || host === "player.mediadelivery.net") {
    return { kind: "iframe", embedSrc: url.toString() };
  }

  // Direct video file (.mp4, .webm, .mov, .m4v, .ogv anywhere in the path)
  if (/\.(mp4|webm|mov|m4v|ogv)(?![a-z0-9])/i.test(url.pathname)) {
    return { kind: "direct", src: url.toString() };
  }

  // Bunny CDN host without obvious extension — still try as a direct video
  if (host.endsWith(".b-cdn.net")) {
    return { kind: "direct", src: url.toString() };
  }

  return { kind: "link", href: url.toString() };
}
