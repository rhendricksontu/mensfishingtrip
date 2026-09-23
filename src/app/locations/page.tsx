import { getAgenda, getCabins } from "@/lib/data";
import type { Cabin } from "@/lib/types";
import MapLink from "@/components/MapLink";
import CabinCheckin from "@/components/CabinCheckin";
import { shortenPlace, addressLines, addressOneLine } from "@/lib/utils";

export const metadata = { title: "Locations · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

// Categorize an auto-derived place by keywords in its name/address so dinner
// spots and river spots get their own sections. Anything unmatched falls into
// "Other Locations" so it's never dropped.
const DINNER_RE =
  /saloon|brewery|grill|restaurant|kitchen|caf[eé]|\bbar\b|pizza|steakhouse|diner|eatery|bbq|tavern|\bpub\b|smokehouse|winery|distillery|tap\s?room/i;
const RIVER_RE =
  /river|park|creek|bend|\bfly\b|float|trail|falls|lake|marina|launch|fishing|canoe|kayak|put.?in|access/i;

type Place = { name: string | null; address: string };
function placeCategory(p: Place): "dinner" | "river" | "other" {
  const hay = `${p.name ?? ""} ${p.address}`;
  if (DINNER_RE.test(hay)) return "dinner";
  if (RIVER_RE.test(hay)) return "river";
  return "other";
}

export default async function LocationsPage() {
  const [agenda, cabins] = await Promise.all([getAgenda(), getCabins()]);

  // Auto-build the list from the agenda so it always stays in sync: one card per
  // distinct real-address place used on an agenda item (skip "Cabins" and blanks).
  const addrKey = (addr: string) => addr.replace(/@.*/, "").trim().toLowerCase();
  // Addresses already shown as cabin cards (a cabin can host events like
  // breakfast, which copies its address onto agenda items) — don't list twice.
  const cabinKeys = new Set(
    cabins.map((c) => addressOneLine(c)).filter(Boolean).map(addrKey)
  );
  const byAddr = new Map<string, { name: string | null; address: string }>();
  for (const item of agenda) {
    const address = item.location?.trim();
    if (!address || !/\d/.test(address)) continue;
    const key = addrKey(address);
    if (cabinKeys.has(key)) continue; // already shown as a cabin card
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
  const dinnerPlaces = places.filter((p) => placeCategory(p) === "dinner");
  const riverPlaces = places.filter((p) => placeCategory(p) === "river");
  const otherPlaces = places.filter((p) => placeCategory(p) === "other");

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
        <div className="space-y-6">
          {cabins.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-brand-700">Cabins</h2>
              {cabins.map((c) => (
                <CabinCard key={c.id} cabin={c} />
              ))}
            </section>
          )}
          {dinnerPlaces.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-brand-700">Dinner Spots</h2>
              {dinnerPlaces.map((p, i) => (
                <PlaceCard key={i} place={p} />
              ))}
            </section>
          )}
          {riverPlaces.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-brand-700">River Locations</h2>
              {riverPlaces.map((p, i) => (
                <PlaceCard key={i} place={p} />
              ))}
            </section>
          )}
          {otherPlaces.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-brand-700">Other Locations</h2>
              {otherPlaces.map((p, i) => (
                <PlaceCard key={i} place={p} />
              ))}
            </section>
          )}
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
      <CabinCheckin name={cabin.name} details={cabin.checkin_details} />
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
