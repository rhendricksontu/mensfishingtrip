import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import LiveRefresh from "@/components/LiveRefresh";
import CacheWarmer from "@/components/CacheWarmer";
import ServiceWorkerUpdater from "@/components/ServiceWorkerUpdater";
import { getSessionUser, getAdminUser } from "@/lib/auth";
import { getCurrentAttendee } from "@/lib/attendee";
import { isSignupLeader } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mensfishingtrip.com"),
  title: "Men's Fishing Trip 2026",
  description:
    "Logistics, RSVP, agenda, and assignments for the annual men's fishing trip in Broken Bow.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a2430",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, admin, me] = await Promise.all([
    getSessionUser(),
    getAdminUser(),
    getCurrentAttendee(),
  ]);
  const isAuthed = Boolean(user);
  const isAdmin = Boolean(admin);
  // Volunteers tab is only visible to organizers and leaders.
  const canSeeSignups = isAdmin || (me ? await isSignupLeader(me.id) : false);
  // Pages to pre-cache for offline use — only ones this user can open.
  const warmRoutes: string[] = [];
  if (isAuthed) warmRoutes.push("/agenda", "/locations");
  if (me) {
    warmRoutes.push("/me");
    if (canSeeSignups) warmRoutes.push("/signups");
  }
  if (isAdmin) {
    warmRoutes.push(
      "/admin/summary",
      "/admin/ar",
      "/admin/rides",
      "/admin/cabins",
      "/admin/fishing",
      "/admin/volunteers",
      "/admin/activities",
      "/admin/roster"
    );
  }
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/* Keep every page (and the nav) live while open and connected. The
            component skips refreshes while a field is focused, so it won't
            interrupt an organizer mid-edit; form pages are skipped entirely. */}
        <ServiceWorkerUpdater />
        <LiveRefresh enabled={isAuthed} />
        <CacheWarmer routes={warmRoutes} />
        <Nav isAuthed={isAuthed} isAdmin={isAdmin} canSeeSignups={canSeeSignups} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
