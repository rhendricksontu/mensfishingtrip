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

// Canonical key for a phone number: US 10-digit when possible, else all digits.
// Used so the same person maps to the same login regardless of formatting.
export function phoneKey(phone: string): string {
  const d = normalizePhone(phone);
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d;
}

// Attendees log in with their phone. Under the hood we key a Supabase Auth
// account to a synthetic email derived from the phone — no SMS, no real email.
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
