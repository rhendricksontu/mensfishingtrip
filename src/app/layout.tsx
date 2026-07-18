import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import SyncIndicator from "@/components/SyncIndicator";
import LiveSync from "@/components/LiveSync";
import ServiceWorkerUpdater from "@/components/ServiceWorkerUpdater";
import { getSessionUser, getAdminUser } from "@/lib/auth";
import { getCurrentAttendee } from "@/lib/attendee";
import { isSignupLeader, getAgendaFiles, getDataVersion } from "@/lib/data";

const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i;

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
      "/admin/coffee",
      "/admin/rides",
      "/admin/cabins",
      "/admin/fishing",
      "/admin/volunteers",
      "/admin/activities",
      "/admin/roster"
    );
  }
  // Agenda image attachments to pre-download so they open offline unviewed.
  const warmAssets = isAuthed
    ? (await getAgendaFiles()).filter((f) => IMAGE_RE.test(f.name)).map((f) => f.url)
    : [];
  // Data version at render time — the SyncIndicator compares this to the live
  // value to show "Tap to Sync" when the server has newer data.
  const dataVersion = isAuthed ? await getDataVersion() : 0;
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/* Refreshes on foreground/reconnect and warms the offline cache; no
            constant polling — the SyncIndicator flags when there's new data. */}
        <ServiceWorkerUpdater />
        <LiveSync enabled={isAuthed} routes={warmRoutes} assets={warmAssets} />
        <Nav isAuthed={isAuthed} isAdmin={isAdmin} canSeeSignups={canSeeSignups} />
        {isAuthed && <SyncIndicator version={dataVersion} />}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
