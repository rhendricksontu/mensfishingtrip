import { getAgenda, getCabins } from "@/lib/data";
import type { Cabin } from "@/lib/types";
import MapLink from "@/components/MapLink";
import { shortenPlace, addressLines, addressOneLine } from "@/lib/utils";

export const metadata = { title: "Locations · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const [agenda, cabins] = await Promise.all([getAgenda(), getCabins()]);

  // Auto-build the list from the agenda so it always stays in sync: one card per
  // distinct real-address place used on an agenda item (skip "Cabins" and blanks).
  const byAddr = new Map<string, { name: string | null; address: string }>();
  for (const item of agenda) {
    const address = item.location?.trim();
    if (!address || !/\d/.test(address)) continue;
    const key = address.replace(/@.*/, "").trim().toLowerCase();
    const existing = byAddr.get(key);
    if (!existing) {
      byAddr.set(key, { name: item.location_name?.trim() || null, address });
    } else if (!existing.name && item.location_name?.trim()) {
      existing.name = item.location_name.trim();
    }
  }
  const places = [...byAddr.values()].sort((a, b) =>
    (a.name || a.address).localeCompare(b.name || b.address)
  );

  const empty = cabins.length === 0 && places.length === 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Important Locations</h1>
        <p className="mt-1 text-brand-600">Cabins, dinner spots, and the river.</p>
      </div>

      {empty ? (
        <div className="card text-brand-600">Locations will be posted here soon.</div>
      ) : (
        <div className="space-y-3">
          {cabins.map((c) => (
            <CabinCard key={c.id} cabin={c} />
          ))}
          {places.map((p, i) => (
            <PlaceCard key={i} place={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function CabinCard({ cabin }: { cabin: Cabin }) {
  const lines = addressLines(cabin);
  const query = addressOneLine(cabin);

  return (
    <div className="card">
      <h3 className="font-semibold text-brand-800">{cabin.name}</h3>
      {lines.length > 0 && (
        <div className="mt-2 text-sm text-brand-600">
          {lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
      {query && (
        <MapLink place={query} className="btn-secondary mt-3">
          Get directions
        </MapLink>
      )}
    </div>
  );
}

function PlaceCard({ place }: { place: { name: string | null; address: string } }) {
  const addr = shortenPlace(place.address);
  return (
    <div className="card">
      <h3 className="font-semibold text-brand-800">{place.name || addr}</h3>
      {place.name && <p className="mt-2 text-sm text-brand-600">{addr}</p>}
      <MapLink place={place.address} className="btn-secondary mt-3">
        Get directions
      </MapLink>
    </div>
  );
}
