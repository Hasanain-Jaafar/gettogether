import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

function detectLocale(pathname: string): "en" | "ar" {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  return "ar";
}

export async function proxy(request: NextRequest) {
  const locale = detectLocale(request.nextUrl.pathname);
  request.headers.set("x-locale", locale);

  const intlResponse = intlMiddleware(request);
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    intlResponse.headers.set("x-locale", locale);
    return intlResponse;
  }

  const sessionResponse = await updateSession(request);
  intlResponse.headers.forEach((value, key) => {
    if (!sessionResponse.headers.has(key)) {
      sessionResponse.headers.set(key, value);
    }
  });
  sessionResponse.headers.set("x-locale", locale);
  return sessionResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
