"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shows a direct video file's first frame as a still thumbnail (for links with no
 * thumbnail image, e.g. Bunny Storage .mp4 files). The src is only set once the
 * tile is near the viewport, and preload="metadata" + the #t fragment makes the
 * browser fetch just enough of the file to paint that frame (iOS Safari included).
 */
export function VideoFrameThumb({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={visible ? `${src.split("#")[0]}#t=0.1` : undefined}
      preload="metadata"
      muted
      playsInline
      disablePictureInPicture
      disableRemotePlayback
      tabIndex={-1}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full object-cover"
    />
  );
}
