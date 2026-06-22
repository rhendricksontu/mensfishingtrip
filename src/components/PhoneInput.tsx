"use client";

import { useState } from "react";

// Format digits progressively as (XXX) XXX-XXXX while typing.
function formatPhoneInput(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function PhoneInput({
  name,
  defaultValue = "",
  required,
  autoComplete = "tel",
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const [val, setVal] = useState(() => formatPhoneInput(defaultValue));
  return (
    <input
      name={name}
      type="tel"
      inputMode="tel"
      autoComplete={autoComplete}
      className="input"
      placeholder="(555) 123-4567"
      // Requires a fully formatted 10-digit number for form validity.
      pattern="\(\d{3}\) \d{3}-\d{4}"
      title="Enter a phone number like (555) 123-4567"
      maxLength={14}
      required={required}
      value={val}
      onChange={(e) => setVal(formatPhoneInput(e.target.value))}
    />
  );
}
