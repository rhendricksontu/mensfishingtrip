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
