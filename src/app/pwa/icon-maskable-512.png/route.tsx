import { renderPwaIcon } from "@/lib/pwa-icon";

export const dynamic = "force-static";

// Android crops maskable icons to a circle/squircle; keep the logo in the safe zone.
export function GET() {
  return renderPwaIcon(512, 0.75);
}
