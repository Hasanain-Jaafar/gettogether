import type { MetadataRoute } from "next";
import { PWA_BACKGROUND_COLOR, PWA_THEME_COLOR } from "@/lib/pwa-icon";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "GetTogether",
    short_name: "GetTogether",
    description:
      "A cozy gathering place where love blossoms and relationships grow. Connect with kindred spirits and build meaningful relationships.",
    lang: "ar",
    dir: "rtl",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: PWA_THEME_COLOR,
    background_color: PWA_BACKGROUND_COLOR,
    categories: ["social", "lifestyle"],
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
