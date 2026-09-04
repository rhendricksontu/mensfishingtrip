"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { updateGolf, type GolfState } from "@/app/golf/actions";
import type { Golf } from "@/lib/types";

const initial: GolfState = { ok: false };

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving…" : "Save Golf Details"}
    </button>
  );
}

// Editable golf details — used by the golf leader (My Trip) and organizers
// (Golf tab). Both write the single golf row.
export default function GolfForm({ golf }: { golf: Golf }) {
  const router = useRouter();
  const [state, action] = useFormState(updateGolf, initial);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="card space-y-4">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <div>
        <span className="label">Title</span>
        <input name="title" className="input" defaultValue={golf.title ?? ""} placeholder="e.g. Saturday Morning Golf" maxLength={120} />
      </div>
      <div>
        <span className="label">Start Time</span>
        <input name="start_time" type="time" className="input" defaultValue={golf.start_time ?? ""} />
      </div>
      <div>
        <span className="label">Location</span>
        <input name="location_name" className="input" defaultValue={golf.location_name ?? ""} placeholder="Course name" maxLength={120} />
      </div>
      <div>
        <span className="label">Address</span>
        <input name="location" className="input" defaultValue={golf.location ?? ""} placeholder="Street address (for the map link)" maxLength={200} />
      </div>
      <div>
        <span className="label">Notes</span>
        <textarea name="notes" className="input min-h-[80px]" defaultValue={golf.notes ?? ""} placeholder="Anything golfers should know" maxLength={2000} />
      </div>
      <SaveBtn />
    </form>
  );
}
