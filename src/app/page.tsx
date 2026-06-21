import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-cream p-4 shadow-xl ring-1 ring-black/5 sm:p-6">
        <Image
          src="/logo.png"
          alt="11th Annual Men's Fishing Trip — Mountain Fork River, Broken Bow, Oklahoma — September 25–27, 2026"
          width={1242}
          height={1242}
          priority
          className="h-auto w-full"
        />
      </div>

      <div className="mt-9 flex flex-col items-center gap-4">
        <Link
          href="/rsvp"
          className="btn-primary px-12 py-3 text-base shadow-sm"
        >
          RSVP
        </Link>

        <p className="text-sm text-brand-600">
          Already RSVP&apos;d?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
          >
            Please sign in.
          </Link>
        </p>
      </div>
    </div>
  );
}
