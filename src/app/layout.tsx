import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { getSessionUser, getAdminUser } from "@/lib/auth";

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
  const [user, admin] = await Promise.all([getSessionUser(), getAdminUser()]);
  const isAuthed = Boolean(user);
  const isAdmin = Boolean(admin);
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav isAuthed={isAuthed} isAdmin={isAdmin} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
