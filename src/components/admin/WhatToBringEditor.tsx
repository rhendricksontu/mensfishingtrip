"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setWhatToBring } from "@/app/admin/actions";

// Organizer editor for the global "What to Bring" note shown on My Trip.
export default function WhatToBringEditor({ initial }: { initial: string }) {
  const router = useRouter();
  const [text, setText] = useState(initial);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const dirty = text !== initial;

  const save = () =>
    start(async () => {
      await setWhatToBring(text);
      setSaved(true);
      router.refresh();
    });

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-brand-800">What to Bring</h2>
        {saved && !dirty && <span className="text-xs font-medium text-olive-700">Saved</span>}
      </div>
      <p className="text-xs text-brand-500">
        Shown on everyone&apos;s My Trip page as an expandable note.
      </p>
      <textarea
        className="input min-h-[120px]"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder="List what attendees should pack / bring…"
      />
      <button
        onClick={save}
        disabled={pending || !dirty}
        className="btn-primary w-36 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
