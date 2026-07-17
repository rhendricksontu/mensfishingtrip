"use client";

import { useState } from "react";

// A required dropdown where choosing "Other" reveals a free-text field.
// On submit, the server uses the free text as the value when "Other" is chosen.
export default function SelectWithOther({
  name,
  options,
  defaultValue = "",
  required,
}: {
  name: string;
  options: string[];
  defaultValue?: string;
  required?: boolean;
}) {
  const isStandard = options.includes(defaultValue);
  const [sel, setSel] = useState(
    isStandard ? defaultValue : defaultValue ? "Other" : ""
  );
  const [other, setOther] = useState(isStandard ? "" : defaultValue);

  return (
    <>
      <select
        name={name}
        className="input"
        value={sel}
        required={required}
        onChange={(e) => {
          const v = e.target.value;
          setSel(v);
          // Clear any typed "Other" text when a standard option is chosen.
          if (v !== "Other") setOther("");
        }}
      >
        <option value="" disabled>Select One</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {sel === "Other" && (
        <input
          name={`${name}_other`}
          className="input mt-2"
          placeholder="Please specify"
          value={other}
          onChange={(e) => setOther(e.target.value)}
          required
          maxLength={100}
        />
      )}
    </>
  );
}
