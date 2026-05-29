export type VideoEmbed =
  | { kind: "youtube"; embedSrc: string }
  | { kind: "tiktok"; embedSrc: string }
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
    if (m) return { kind: "tiktok", embedSrc: `https://www.tiktok.com/embed/v2/${m[1]}` };
    // vm.tiktok.com / vt.tiktok.com short links — fall through to plain link (we can't resolve them client-side)
  }

  // Direct video file
  if (/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(url.pathname + url.search)) {
    return { kind: "direct", src: url.toString() };
  }

  return { kind: "link", href: url.toString() };
}
