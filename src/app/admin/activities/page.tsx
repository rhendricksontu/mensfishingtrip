import { requireAdmin } from "@/lib/require-admin";
import { getAttendees } from "@/lib/data";
import { ACTIVITY_OPTIONS } from "@/lib/config";
import PhoneLink from "@/components/PhoneLink";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  await requireAdmin();
  const attendees = await getAttendees();

  // Interested people per standard activity, name-sorted.
  const byActivity = ACTIVITY_OPTIONS.map((opt) => ({
    ...opt,
    people: attendees
      .filter((a) => a.activities?.includes(opt.value))
      .sort((x, y) => x.name.localeCompare(y.name)),
  }));

  // "Other" responses carry a free-text description.
  const others = attendees
    .filter((a) => a.activity_other?.trim())
    .sort((x, y) => x.name.localeCompare(y.name));

  const totalResponses =
    byActivity.reduce((n, g) => n + g.people.length, 0) + others.length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-800">Activity Interest</h2>
        <p className="text-sm text-brand-600">
          Who checked each activity on their RSVP. Tap a phone to call.
        </p>
      </div>

      {totalResponses === 0 ? (
        <div className="card text-brand-600">No activity interest yet.</div>
      ) : (
        <div className="space-y-3">
          {byActivity.map((g) => (
            <div key={g.value} className="card">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-brand-800">{g.label}</h3>
                <span className="badge bg-brand-50 text-brand-600">
                  {g.people.length}
                </span>
              </div>
              {g.people.length === 0 ? (
                <p className="mt-2 text-sm text-brand-400">No one yet.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {g.people.map((a) => (
                    <li key={a.id} className="text-sm">
                      <span className="font-medium text-brand-800">{a.name}</span>
                      <PhoneLink phone={a.phone} className="ml-2 text-xs text-brand-400 underline" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="card">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-brand-800">Other</h3>
              <span className="badge bg-brand-50 text-brand-600">{others.length}</span>
            </div>
            {others.length === 0 ? (
              <p className="mt-2 text-sm text-brand-400">No one yet.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {others.map((a) => (
                  <li key={a.id} className="text-sm">
                    <span className="font-medium text-brand-800">{a.name}</span>
                    <PhoneLink phone={a.phone} className="ml-2 text-xs text-brand-400 underline" />
                    <span className="ml-2 text-brand-500">— {a.activity_other}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
