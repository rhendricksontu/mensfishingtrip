import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { TRIP } from "@/lib/config";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
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
  const isAuthed = Boolean(await getSessionUser());
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav isAuthed={isAuthed} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        <footer className="bg-cream">
          <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-brand-500">
            <p>{TRIP.name} · {TRIP.location}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
