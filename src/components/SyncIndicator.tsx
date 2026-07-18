"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// A subtle status pill: confirms the page is live and gives a manual refresh
// (standalone PWAs have no address bar / pull-to-refresh). Auto-refresh still
// runs in the background via LiveRefresh; this is the reassuring override.
export default function SyncIndicator() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const label = !online ? "Offline" : pending ? "Refreshing…" : "Online";

  return (
    <div className="flex justify-center pt-2">
      <button
        type="button"
        onClick={() => start(() => router.refresh())}
        disabled={pending || !online}
        aria-label="Refresh"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-brand-400 hover:text-brand-700 disabled:opacity-60"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            !online
              ? "bg-red-500 shadow-[0_0_5px_1px_#ef4444]"
              : pending
                ? "bg-amber-400 shadow-[0_0_5px_1px_#fbbf24]"
                : "bg-green-500 shadow-[0_0_5px_1px_#22c55e]"
          }`}
        />
        {label}
      </button>
    </div>
  );
}
