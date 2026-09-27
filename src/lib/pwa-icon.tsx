import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Brand colors, kept in sync with the manifest / viewport theme color.
export const PWA_THEME_COLOR = "#e14f9f";
export const PWA_BACKGROUND_COLOR = "#ffffff";

/**
 * Renders the heart logo on an opaque square, for home-screen icons.
 *
 * - `scale` is the logo size relative to the canvas. Maskable icons need the
 *   logo inside the central 80% safe zone, so they use a smaller scale.
 * - The background is always opaque: iOS fills transparent pixels with black.
 */
export async function renderPwaIcon(size: number, scale = 0.92) {
  const logo = await readFile(path.join(process.cwd(), "public", "heart.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  const logoSize = Math.round(size * scale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: PWA_BACKGROUND_COLOR,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={logoSize} height={logoSize} alt="" />
      </div>
    ),
    { width: size, height: size }
  );
}
