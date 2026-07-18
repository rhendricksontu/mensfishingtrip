"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCoffeeReady, clearCoffeeOrder } from "@/app/admin/actions";
import { COFFEE_DAYS } from "@/lib/config";
import { to24Hour } from "@/lib/utils";
import PhoneLink from "@/components/PhoneLink";
import type { Attendee, CoffeeOrder } from "@/lib/types";

interface Row {
  order: CoffeeOrder;
  name: string;
  phone: string;
}

export default function CoffeeClient({
  orders,
  attendees,
}: {
  orders: CoffeeOrder[];
  attendees: Attendee[];
}) {
  const byId = new Map(attendees.map((a) => [a.id, a]));

  const rowsFor = (day: string): Row[] =>
    orders
      .filter((o) => o.day === day)
      .map((o) => {
        const a = byId.get(o.attendee_id);
        return { order: o, name: a?.name ?? "Unknown", phone: a?.phone ?? "" };
      })
      // Earliest pickup first; ties broken alphabetically.
      .sort(
        (x, y) =>
          to24Hour(x.order.pickup_time).localeCompare(to24Hour(y.order.pickup_time)) ||
          x.name.localeCompare(y.name)
      );

  return (
    <div className="space-y-4">
      {COFFEE_DAYS.map(({ day, label }) => {
        const rows = rowsFor(day);
        return (
          <div key={day} className="card">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-brand-800">{label} Coffee</h3>
              <span className="text-sm text-brand-400">{rows.length} order{rows.length === 1 ? "" : "s"}</span>
            </div>
            {rows.length === 0 ? (
              <p className="mt-2 text-sm text-brand-400">No orders yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {rows.map((r) => (
                  <CoffeeRow key={r.order.id} row={r} />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CoffeeRow({ row }: { row: Row }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { order, name, phone } = row;
  const ready = order.status === "ready";

  const toggle = (val: boolean) =>
    start(async () => {
      await setCoffeeReady(order.id, val);
      router.refresh();
    });

  const clear = () =>
    start(async () => {
      await clearCoffeeOrder(order.id);
      router.refresh();
    });

  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
        ready ? "border-olive-300 bg-olive-50" : "border-brand-100"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-brand-700">{order.pickup_time}</span>
          <span className="truncate font-medium text-brand-800">{name}</span>
        </div>
        <p className="text-sm text-brand-600">{order.drink}</p>
        {phone && <PhoneLink phone={phone} className="text-xs text-brand-400 underline" />}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {ready ? (
          <button
            onClick={() => toggle(false)}
            disabled={pending}
            className="rounded-full bg-olive-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-olive-700 disabled:opacity-60"
          >
            Ready ✓
          </button>
        ) : (
          <button
            onClick={() => toggle(true)}
            disabled={pending}
            className="btn-primary text-sm"
          >
            Ready for Pickup
          </button>
        )}
        <button
          onClick={clear}
          disabled={pending}
          className="text-xs text-brand-400 underline hover:text-red-600 disabled:opacity-60"
        >
          Clear from queue
        </button>
      </div>
    </li>
  );
}
