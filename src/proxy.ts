import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const LOCALIZED_PATHS = ["/", "/sign-in", "/sign-up"];

function isLocalized(pathname: string): boolean {
  // Strip locale prefix when checking
  const stripped = pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  return (
    LOCALIZED_PATHS.includes(stripped) ||
    stripped.startsWith("/sign-in") ||
    stripped.startsWith("/sign-up")
  );
}

export async function proxy(request: NextRequest) {
  if (isLocalized(request.nextUrl.pathname)) {
    return intlMiddleware(request);
  }
  return await updateSession(request);
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
