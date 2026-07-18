"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { pickUpCoffeeOrder } from "@/app/coffee/actions";
import { COFFEE_DAYS } from "@/lib/config";
import type { CoffeeOrder } from "@/lib/types";

// Shown on My Trip when the organizer marks the member's coffee ready. Tapping
// "I picked up my order" clears the banner and the order from the queue.
export default function CoffeeReadyBanner({ orders }: { orders: CoffeeOrder[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const dayLabel = (d: string) => COFFEE_DAYS.find((c) => c.day === d)?.label ?? d;

  if (orders.length === 0) return null;

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="card border-l-4 border-olive-500 bg-olive-50">
          <p className="font-bold text-brand-800">☕ Your Coffee Order is Ready!</p>
          <p className="mt-1 text-sm text-brand-600">
            {o.drink} · {dayLabel(o.day)} pickup at {o.pickup_time}
          </p>
          <button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await pickUpCoffeeOrder(o.id);
                router.refresh();
              })
            }
            className="btn-primary mt-3"
          >
            I picked up my order
          </button>
        </div>
      ))}
    </div>
  );
}
