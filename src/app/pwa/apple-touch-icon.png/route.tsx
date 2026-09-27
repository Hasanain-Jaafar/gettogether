import { renderPwaIcon } from "@/lib/pwa-icon";

export const dynamic = "force-static";

// iOS home-screen icon (it rounds the corners itself and ignores SVG icons).
export function GET() {
  return renderPwaIcon(180);
}
