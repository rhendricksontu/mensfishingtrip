"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { classNames } from "@/lib/utils";
import { signOutAttendee } from "@/app/me/actions";

export default function Nav({
  isAuthed,
  isAdmin,
  canSeeSignups,
}: {
  isAuthed: boolean;
  isAdmin: boolean;
  canSeeSignups: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on any route change (e.g. after login/logout), since
  // the Nav persists in the layout and would otherwise keep its open state.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  const links = [
    { href: "/me", label: "My Trip" },
    { href: "/agenda", label: "Agenda" },
    ...(canSeeSignups ? [{ href: "/signups", label: "Volunteers" }] : []),
    { href: "/locations", label: "Locations" },
    // Link straight to a real page (not the /admin redirect) so it opens offline.
    ...(isAdmin ? [{ href: "/admin/summary", label: "Organizer" }] : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    // Keep "Organizer" highlighted across every admin tab.
    if (href.startsWith("/admin")) return pathname.startsWith("/admin");
    return pathname.startsWith(href);
  };

  // Offline, client-side routing (RSC fetch) fails; force a full-page navigation
  // so the cached document loads instead.
  const offlineFullNav = (e: { preventDefault: () => void }, href: string) => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      e.preventDefault();
      window.location.assign(href);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-brand-700 text-white shadow">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
          <Image
            src="/trout.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full bg-cream object-cover ring-1 ring-white/30"
          />
          <span className="whitespace-nowrap">Men&apos;s Fishing Trip</span>
        </Link>

        {isAuthed ? (
          <>
            <nav className="hidden lg:flex items-center gap-0.5">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  prefetch={false}
                  onClick={(e) => offlineFullNav(e, l.href)}
                  className={classNames(
                    "whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium",
                    isActive(l.href)
                      ? "bg-cream text-brand-700"
                      : "text-white hover:bg-brand-600"
                  )}
                >
                  {l.label}
                </Link>
              ))}
              <form action={signOutAttendee}>
                <button
                  type="submit"
                  className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-brand-600"
                >
                  Log Out
                </button>
              </form>
            </nav>

            <button
              className="lg:hidden rounded-md p-2 hover:bg-brand-600"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? (
                  <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </>
        ) : pathname === "/login" ? (
          <Link
            href="/"
            aria-label="Home"
            className="p-2 text-cream hover:text-cream-200"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
        ) : (
          <Link
            href="/login"
            aria-label="Log In"
            className="p-2 text-cream hover:text-cream-200"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </Link>
        )}
      </div>

      {isAuthed && open && (
        <nav className="lg:hidden border-t border-brand-600 bg-brand-700 px-2 pb-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={false}
              onClick={(e) => {
                offlineFullNav(e, l.href);
                setOpen(false);
              }}
              className={classNames(
                "block rounded-md px-3 py-2.5 text-base font-medium",
                isActive(l.href)
                  ? "bg-cream text-brand-700"
                  : "text-white hover:bg-brand-600"
              )}
            >
              {l.label}
            </Link>
          ))}
          <form action={signOutAttendee}>
            <button
              type="submit"
              className="block w-full rounded-md px-3 py-2.5 text-left text-base font-medium hover:bg-brand-600"
            >
              Log Out
            </button>
          </form>
        </nav>
      )}
    </header>
  );
}
