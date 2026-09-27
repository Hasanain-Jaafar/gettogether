export type VideoEmbed =
  | { kind: "youtube"; embedSrc: string; isShorts: boolean }
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
    if (id) return { kind: "youtube", embedSrc: `https://www.youtube.com/embed/${id}`, isShorts: false };
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v) return { kind: "youtube", embedSrc: `https://www.youtube.com/embed/${v}`, isShorts: false };
    const shortsMatch = url.pathname.match(/^\/shorts\/([^/?#]+)/);
    if (shortsMatch) return { kind: "youtube", embedSrc: `https://www.youtube.com/embed/${shortsMatch[1]}`, isShorts: true };
    const embedMatch = url.pathname.match(/^\/embed\/([^/?#]+)/);
    if (embedMatch) return { kind: "youtube", embedSrc: `https://www.youtube.com/embed/${embedMatch[1]}`, isShorts: false };
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
    url.searchParams.set("autoplay", "false");
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

/**
 * A stable identity for the video a link points at, so the same video posted
 * through different URL forms (youtu.be vs watch?v=, extra query params, a
 * Bunny /play vs /embed link) is recognized as one. Null if it isn't a video link.
 */
export function videoKey(rawUrl: string): string | null {
  const embed = getVideoEmbed(rawUrl);
  if (!embed) return null;
  switch (embed.kind) {
    case "youtube":
      return `youtube:${new URL(embed.embedSrc).pathname.split("/").pop()}`;
    case "tiktok":
      return `tiktok:${new URL(embed.embedSrc).pathname.split("/").pop()}`;
    case "iframe": {
      const url = new URL(embed.embedSrc);
      const bunny = url.pathname.match(/^\/(?:embed|play)\/([^/]+)\/([^/?#]+)/);
      return bunny ? `bunny:${bunny[1]}/${bunny[2]}` : `iframe:${url.host}${url.pathname}`;
    }
    case "direct": {
      const url = new URL(embed.src);
      return `file:${url.host.toLowerCase()}${decodeURIComponent(url.pathname)}`;
    }
    case "link": {
      const url = new URL(embed.href);
      return `link:${url.host.toLowerCase()}${url.pathname}${url.search}`;
    }
  }
}
