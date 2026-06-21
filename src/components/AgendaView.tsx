import { getAgenda } from "@/lib/data";
import { DAY_LABELS, TRIP_DAYS } from "@/lib/config";
import type { AgendaItem } from "@/lib/types";

export default async function AgendaView() {
  const items = await getAgenda();
  const byDay = TRIP_DAYS.map((day) => ({
    day,
    items: items.filter((i) => i.trip_day === day),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Weekend Agenda</h1>
        <p className="mt-1 text-brand-600">Friday through Sunday. Times are approximate.</p>
      </div>

      {items.length === 0 && (
        <div className="card text-brand-600">
          The agenda will appear here once it&apos;s set. Check back soon.
        </div>
      )}

      {byDay.map(
        ({ day, items }) =>
          items.length > 0 && (
            <section key={day}>
              <h2 className="mb-3 text-lg font-bold text-brand-700">{DAY_LABELS[day]}</h2>
              <ol className="space-y-3">
                {items.map((item) => (
                  <AgendaRow key={item.id} item={item} />
                ))}
              </ol>
            </section>
          )
      )}
    </div>
  );
}

function AgendaRow({ item }: { item: AgendaItem }) {
  return (
    <li className="card flex gap-4">
      <div className="w-20 shrink-0 text-sm font-semibold text-brand-600">
        {item.start_time || "—"}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-brand-800">{item.title}</h3>
        {item.description && (
          <p className="mt-0.5 text-sm text-brand-600">{item.description}</p>
        )}
        {item.location && (
          <p className="mt-1 text-xs font-medium text-brand-500">📍 {item.location}</p>
        )}
      </div>
    </li>
  );
}
