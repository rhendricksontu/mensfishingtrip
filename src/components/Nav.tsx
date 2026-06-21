"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { classNames } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/agenda", label: "Agenda" },
  { href: "/signups", label: "Signups" },
  { href: "/locations", label: "Locations" },
  { href: "/me", label: "My Trip" },
];

export default function Nav({ isAuthed }: { isAuthed: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-brand-700 text-white shadow">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <Image
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full bg-cream object-cover ring-1 ring-white/30"
          />
          <span>Men&apos;s Fishing Trip</span>
        </Link>

        {isAuthed ? (
          <>
            <nav className="hidden sm:flex items-center gap-1">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={classNames(
                    "rounded-md px-3 py-1.5 text-sm font-medium hover:bg-brand-600",
                    isActive(l.href) && "bg-brand-600"
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <button
              className="sm:hidden rounded-md p-2 hover:bg-brand-600"
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
            className="rounded-md px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ring-white/30 hover:bg-brand-600"
          >
            Log in
          </Link>
        )}
      </div>

      {isAuthed && open && (
        <nav className="sm:hidden border-t border-brand-600 bg-brand-700 px-2 pb-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={classNames(
                "block rounded-md px-3 py-2.5 text-base font-medium hover:bg-brand-600",
                isActive(l.href) && "bg-brand-600"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
