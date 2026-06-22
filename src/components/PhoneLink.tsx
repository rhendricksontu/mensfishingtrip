import { formatPhone, normalizePhone } from "@/lib/utils";

// A tappable phone number (call or text). Works in server and client trees.
export default function PhoneLink({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:${normalizePhone(phone)}`}
      className="text-brand-600 underline decoration-brand-300 underline-offset-2"
    >
      {formatPhone(phone)}
    </a>
  );
}
