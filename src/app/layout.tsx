import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Link from "next/link";
import { TRIP } from "@/lib/config";

export const metadata: Metadata = {
  title: "Men's Fishing Trip 2026",
  description:
    "Logistics, RSVP, agenda, and assignments for the annual men's fishing trip in Broken Bow.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#264d3e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-pine-100 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-pine-500">
            <p>{TRIP.name} · {TRIP.location}</p>
            <p className="mt-1">
              <Link href="/admin" className="underline hover:text-pine-700">
                Organizer login
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
