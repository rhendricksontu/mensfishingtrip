"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setGolfLeader } from "@/app/golf/actions";
import PhoneLink from "@/components/PhoneLink";
import GolfForm from "@/components/GolfForm";
import GolfersList from "@/components/GolfersList";
import type { Attendee, Golf } from "@/lib/types";

export default function GolfClient({
  golf,
  attendees,
}: {
  golf: Golf;
  attendees: Attendee[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const leader = golf.leader_id ? attendees.find((a) => a.id === golf.leader_id) : null;
  const sorted = [...attendees].sort((a, b) => a.name.localeCompare(b.name));
  const golfers = sorted.filter((a) => (a.activities ?? []).includes("golfing"));

  const setLeader = (id: string | null) =>
    start(async () => {
      await setGolfLeader(id);
      router.refresh();
    });

  return (
    <div className={`space-y-4 ${pending ? "opacity-60" : ""}`}>
      <div className="card space-y-2">
        <h3 className="font-bold text-brand-800">Golf Leader</h3>
        {leader ? (
          <p className="text-sm">
            <span className="badge mr-1 bg-olive-600 text-white">Leader</span>
            <span className="font-medium text-brand-800">{leader.name}</span>
            <PhoneLink phone={leader.phone} className="ml-2 text-xs text-brand-400 underline" />
          </p>
        ) : (
          <p className="text-xs text-brand-400">No leader assigned yet.</p>
        )}
        <div>
          <span className="label">Leader</span>
          <select
            value={golf.leader_id ?? ""}
            onChange={(e) => setLeader(e.target.value || null)}
            className="input"
          >
            <option value="">No leader</option>
            {sorted.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-bold text-brand-800">Golf Details</h3>
        <GolfForm golf={golf} />
      </div>

      <GolfersList golfers={golfers} />
    </div>
  );
}
