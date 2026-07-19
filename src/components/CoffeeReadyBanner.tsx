"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { pickUpCoffeeOrder } from "@/app/coffee/actions";
import type { CoffeeOrder } from "@/lib/types";

// Shown on My Trip when the organizer marks the member's coffee ready. Tapping
// "I picked up my order" clears the banner and the order from the queue.
export default function CoffeeReadyBanner({ orders }: { orders: CoffeeOrder[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (orders.length === 0) return null;

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="card border-l-4 border-[#6f4e37] bg-olive-50">
          <p className="font-bold text-brand-800">☕ Your {o.drink} is Ready!</p>
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
            I picked up my order.
          </button>
        </div>
      ))}
    </div>
  );
}
