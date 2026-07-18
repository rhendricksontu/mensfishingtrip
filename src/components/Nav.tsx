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
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-cream px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-cream-200"
          >
            Log In
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
              onClick={() => setOpen(false)}
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
