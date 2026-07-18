import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Refreshes the Supabase auth session cookie on each request so admin
// sessions stay valid. Runs only on admin routes.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return response;

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public pages anyone can see without logging in. Everything else requires auth.
  const path = request.nextUrl.pathname;
  const PUBLIC = ["/", "/login", "/rsvp", "/reset", "/admin/login"];
  const isPublic = PUBLIC.includes(path);

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const redirectRes = NextResponse.redirect(url);
    redirectRes.headers.set("Cache-Control", "no-store, must-revalidate");
    return redirectRes;
  }

  // Dynamic, per-user pages must not be cached by the browser — especially an
  // iOS "Add to Home Screen" webview, which otherwise serves a stale app shell
  // indefinitely. Static assets (JS/CSS/images) are excluded by the matcher and
  // keep their immutable long cache.
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

export const config = {
  // Refresh the auth session on all app routes. Skip static assets, images, and
  // the service worker / manifest (they must be reachable when logged out, or
  // the auth redirect below would break registration and install).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|swe-worker-.*|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
