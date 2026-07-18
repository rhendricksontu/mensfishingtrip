import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import LiveRefresh from "@/components/LiveRefresh";
import CacheWarmer from "@/components/CacheWarmer";
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
  // Member pages to pre-cache for offline use (only ones this user can open).
  const warmRoutes = me
    ? ["/me", "/agenda", "/locations", ...(canSeeSignups ? ["/signups"] : [])]
    : [];
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/* Keep the nav + page live for members on the pages that change most.
            Admins are skipped so their editors aren't disrupted mid-change.
            The Volunteers page polls itself (faster) so it isn't listed here. */}
        <LiveRefresh enabled={!isAdmin} activePrefixes={["/me", "/agenda"]} />
        <CacheWarmer routes={warmRoutes} />
        <Nav isAuthed={isAuthed} isAdmin={isAdmin} canSeeSignups={canSeeSignups} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
