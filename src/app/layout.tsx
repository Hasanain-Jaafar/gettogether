import type { Metadata, Viewport } from "next";
import { Tajawal, Zain } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
});

const zain = Zain({
  variable: "--font-zain",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "GetTogether",
  description: "A cozy gathering place where love blossoms and relationships grow. Connect with kindred spirits and build meaningful relationships.",
  applicationName: "GetTogether",
  icons: {
    icon: [
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icons/favicon.svg",
    apple: { url: "/pwa/apple-touch-icon.png", sizes: "180x180" },
  },
  appleWebApp: {
    capable: true,
    title: "GetTogether",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0e090a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${tajawal.variable} ${zain.variable} antialiased font-arabic`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NavigationProgress />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
