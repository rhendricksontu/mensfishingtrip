// Strip everything but digits, for comparing phone numbers.
export function normalizePhone(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

// Pretty-print a US-style phone number; falls back to the raw string.
export function formatPhone(phone: string): string {
  const d = normalizePhone(phone);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d.startsWith("1"))
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return phone;
}

export function classNames(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

// "07:30" (24h, from <input type="time">) -> "7:30 AM".
export function to12Hour(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return hhmm.trim();
  let h = parseInt(m[1], 10);
  const mer = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${mer}`;
}

// "7:30 AM" -> "07:30" (24h) for <input type="time">. Returns "" if unparseable.
export function to24Hour(label: string): string {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec(label.trim());
  if (!m) return "";
  let h = parseInt(m[1], 10);
  const mer = m[3]?.toLowerCase();
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

// Build display lines from a structured street address. Falls back to the
// legacy free-text `address` when no structured parts are present.
export function addressLines(a: {
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  address?: string | null;
}): string[] {
  const lines: string[] = [];
  if (a.address1?.trim()) lines.push(a.address1.trim());
  if (a.address2?.trim()) lines.push(a.address2.trim());
  const cityState = [a.city?.trim(), a.state?.trim()].filter(Boolean).join(", ");
  const lastLine = [cityState, a.zip?.trim()].filter(Boolean).join(" ").trim();
  if (lastLine) lines.push(lastLine);
  if (lines.length === 0 && a.address?.trim()) {
    return a.address.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  return lines;
}

// A single-line version, suitable as a maps query.
export function addressOneLine(a: Parameters<typeof addressLines>[0]): string {
  return addressLines(a).join(", ");
}

// Canonical key for a phone number: US 10-digit when possible, else all digits.
// Used so the same person maps to the same login regardless of formatting.
export function phoneKey(phone: string): string {
  const d = normalizePhone(phone);
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d;
}

// Attendees log in with their phone. Under the hood we key a Supabase Auth
// account to a synthetic email derived from the phone, no SMS, no real email.
export const PHONE_EMAIL_DOMAIN = "phone.mensfishingtrip.com";
export function authEmailForPhone(phone: string): string {
  return `${phoneKey(phone)}@${PHONE_EMAIL_DOMAIN}`;
}

// Clean a "Venue · 123 St, City, ST" display string into a maps search query.
function mapsQuery(place: string): string {
  return encodeURIComponent(place.replace(/·/g, " ").replace(/\s+/g, " ").trim());
}
export function googleMapsUrl(place: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${mapsQuery(place)}`;
}
export function appleMapsUrl(place: string): string {
  return `https://maps.apple.com/?q=${mapsQuery(place)}`;
}
export function wazeUrl(place: string): string {
  return `https://waze.com/ul?q=${mapsQuery(place)}&navigate=yes`;
}

// Display-only cleanup. The data may carry a longer name (for geocoding) or an
// "@lat,lng" coordinate marker (for exact routing); strip those for display.
export function shortenPlace(s: string): string {
  return s
    .replace(" & Professional Guide Service", "")
    .replace(/\s*@\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*/, "")
    .trim();
}
