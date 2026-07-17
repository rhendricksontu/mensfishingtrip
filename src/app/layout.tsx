import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { getSessionUser, getAdminUser } from "@/lib/auth";
import { getCurrentAttendee } from "@/lib/attendee";
import { isSignupParticipant } from "@/lib/data";

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
  // Signups tab is only visible to organizers, leaders, and assigned helpers.
  const canSeeSignups = isAdmin || (me ? await isSignupParticipant(me.id) : false);
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav isAuthed={isAuthed} isAdmin={isAdmin} canSeeSignups={canSeeSignups} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
