"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { placeCoffeeOrder, cancelCoffeeOrder, type CoffeeState } from "@/app/coffee/actions";
import { COFFEE_DRINKS, futureCoffeePickupTimes } from "@/lib/config";
import type { CoffeeDay, CoffeeOrder } from "@/lib/types";

const initial: CoffeeState = { ok: false };

function SaveBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

export default function CoffeeOrderButton({
  day,
  existing,
}: {
  day: CoffeeDay;
  existing: CoffeeOrder | null;
}) {
  const router = useRouter();
  const [state, action] = useFormState(placeCoffeeOrder, initial);
  const [open, setOpen] = useState(false);
  const [cancelling, startCancel] = useTransition();

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  // Only upcoming slots — past pickup times drop off as the morning progresses.
  const times = futureCoffeePickupTimes(day);
  // Keep the current order's time selectable when editing, even if it just passed.
  const timeOptions =
    existing?.pickup_time && !times.includes(existing.pickup_time)
      ? [existing.pickup_time, ...times]
      : times;

  // No order and no times left: ordering for this day has closed — show nothing.
  if (!existing && times.length === 0) return null;

  if (!open) {
    return (
      <div className="mt-3 rounded-lg bg-brand-50 p-3">
        {existing ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-brand-800">☕ {existing.drink}</p>
              <p className="text-brand-600">
                Pickup {existing.pickup_time}
                {existing.status === "ready" && (
                  <span className="ml-2 font-semibold text-olive-700">· Ready!</span>
                )}
              </p>
            </div>
            <button onClick={() => setOpen(true)} className="btn-secondary shrink-0 text-sm">
              Edit
            </button>
          </div>
        ) : (
          <button onClick={() => setOpen(true)} className="btn-primary w-full">
            Order Coffee
          </button>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="mt-3 space-y-3 rounded-lg bg-brand-50 p-3">
      <input type="hidden" name="day" value={day} />
      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <div>
        <span className="label">Your Coffee</span>
        <select name="drink" className="input" defaultValue={existing?.drink ?? ""} required>
          <option value="" disabled>
            Select a drink
          </option>
          {COFFEE_DRINKS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div>
        <span className="label">Pickup Time</span>
        <select
          name="pickup_time"
          className="input"
          defaultValue={existing?.pickup_time ?? ""}
          required
        >
          <option value="" disabled>
            Select a time
          </option>
          {timeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SaveBtn label={existing ? "Update Order" : "Place Order"} />
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Cancel
        </button>
        {existing && (
          <button
            type="button"
            disabled={cancelling}
            onClick={() =>
              startCancel(async () => {
                await cancelCoffeeOrder(day);
                setOpen(false);
                router.refresh();
              })
            }
            className="ml-auto text-sm text-red-600 underline hover:text-red-700"
          >
            Remove order
          </button>
        )}
      </div>
    </form>
  );
}
