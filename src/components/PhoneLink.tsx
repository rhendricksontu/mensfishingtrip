import { formatPhone, normalizePhone } from "@/lib/utils";

// A tappable phone number (call or text). Works in server and client trees.
// Pass `className` to match the surrounding text; omit for the default link look.
export default function PhoneLink({
  phone,
  className,
}: {
  phone: string;
  className?: string;
}) {
  return (
    <a
      href={`tel:${normalizePhone(phone)}`}
      className={className ?? "text-brand-600 underline decoration-brand-300 underline-offset-2"}
    >
      {formatPhone(phone)}
    </a>
  );
}
