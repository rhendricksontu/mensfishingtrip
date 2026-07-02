"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DAY_LABELS, TRIP_DAYS } from "@/lib/config";
import { shortenPlace } from "@/lib/utils";
import MapLink from "@/components/MapLink";
import {
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  uploadAgendaFile,
  deleteAgendaFile,
} from "@/app/admin/actions";
import type { AgendaItem, AgendaFile } from "@/lib/types";

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export default function AgendaBoard({
  items,
  files,
  isAdmin,
}: {
  items: AgendaItem[];
  files: AgendaFile[];
  isAdmin: boolean;
}) {
  const filesFor = (id: string) => files.filter((f) => f.agenda_item_id === id);
  const byDay = TRIP_DAYS.map((day) => ({
    day,
    items: items.filter((i) => i.trip_day === day),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Weekend Agenda</h1>
        <p className="mt-1 text-brand-600">Friday through Sunday. Times are approximate.</p>
      </div>

      {items.length === 0 && !isAdmin && (
        <div className="card text-brand-600">
          The agenda will appear here once it&apos;s set. Check back soon.
        </div>
      )}

      {byDay.map(
        ({ day, items: dayItems }) =>
          (dayItems.length > 0 || isAdmin) && (
            <section key={day}>
              <h2 className="mb-3 text-lg font-bold text-brand-700">{DAY_LABELS[day]}</h2>
              <ol className="space-y-3">
                {dayItems.map((item) => (
                  <AgendaRow
                    key={item.id}
                    item={item}
                    files={filesFor(item.id)}
                    isAdmin={isAdmin}
                  />
                ))}
              </ol>
              {isAdmin && <AddAgendaItem day={day} />}
            </section>
          )
      )}
    </div>
  );
}

function AgendaRow({
  item,
  files,
  isAdmin,
}: {
  item: AgendaItem;
  files: AgendaFile[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    start(async () => {
      const res = await uploadAgendaFile(item.id, fd);
      if (res && !res.ok) alert(res.error ?? "Upload failed.");
      router.refresh();
    });
    e.target.value = "";
  }

  // ---- Admin edit view ----
  if (isAdmin && editing) {
    return (
      <li className={`card space-y-3 ${pending ? "opacity-60" : ""}`}>
        <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
          <div>
            <span className="label">Start Time</span>
            <input
              className="input"
              defaultValue={item.start_time ?? ""}
              placeholder="7:30 AM"
              onBlur={(e) =>
                e.target.value.trim() !== (item.start_time ?? "") &&
                run(() => updateAgendaItem(item.id, { start_time: e.target.value.trim() || null }))
              }
            />
          </div>
          <div>
            <span className="label">Title</span>
            <input
              className="input"
              defaultValue={item.title}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== item.title) run(() => updateAgendaItem(item.id, { title: v }));
              }}
            />
          </div>
        </div>
        <div>
          <span className="label">Description</span>
          <textarea
            className="input min-h-[4rem]"
            rows={2}
            defaultValue={item.description ?? ""}
            placeholder="Optional details"
            onBlur={(e) =>
              e.target.value.trim() !== (item.description ?? "") &&
              run(() => updateAgendaItem(item.id, { description: e.target.value.trim() || null }))
            }
          />
        </div>

        <div>
          <span className="label">Attachments</span>
          {files.length > 0 && (
            <ul className="mb-2 space-y-1">
              {files.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 text-sm">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-brand-600 underline"
                  >
                    {f.name}
                  </a>
                  <button
                    onClick={() => run(() => deleteAgendaFile(f.id))}
                    className="shrink-0 text-xs text-brand-400 underline hover:text-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input type="file" onChange={onPickFile} className="block w-full text-sm text-brand-600" />
        </div>

        <div className="flex justify-between gap-2 border-t border-brand-50 pt-3">
          <button
            onClick={() => {
              if (confirm(`Delete "${item.title}"?`)) run(() => deleteAgendaItem(item.id));
            }}
            className="btn-danger"
          >
            Delete
          </button>
          <button onClick={() => setEditing(false)} className="btn-secondary">
            Done
          </button>
        </div>
      </li>
    );
  }

  // ---- Read view (everyone) ----
  return (
    <li className={`card flex gap-4 ${pending ? "opacity-60" : ""}`}>
      <div className="w-20 shrink-0 text-sm font-semibold text-brand-600">
        {item.start_time || "-"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-brand-800">{item.title}</h3>
          {isAdmin && (
            <button
              onClick={() => setEditing(true)}
              aria-label="Edit agenda item"
              className="shrink-0 text-brand-400 hover:text-brand-700"
            >
              <EditIcon />
            </button>
          )}
        </div>
        {item.description && (
          <p className="mt-0.5 whitespace-pre-line text-sm text-brand-600">{item.description}</p>
        )}
        {item.location &&
          (/\d/.test(item.location) ? (
            <MapLink
              place={item.location}
              className="mt-1 inline-block text-xs font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
            >
              {shortenPlace(item.location)}
            </MapLink>
          ) : (
            <p className="mt-1 text-xs font-medium text-brand-500">{shortenPlace(item.location)}</p>
          ))}
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f) => (
              <li key={f.id}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
                >
                  📎 {f.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function AddAgendaItem({ day }: { day: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  function add() {
    if (!title.trim()) return;
    start(async () => {
      await createAgendaItem(day, {
        start_time: time.trim() || null,
        title: title.trim(),
        description: desc.trim() || null,
      });
      setTime("");
      setTitle("");
      setDesc("");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary mt-3 w-full">
        + Add Agenda Item
      </button>
    );
  }

  return (
    <div className="card mt-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
        <div>
          <span className="label">Start Time</span>
          <input className="input" placeholder="7:30 AM" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div>
          <span className="label">Title</span>
          <input className="input" placeholder="Agenda item" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>
      <div>
        <span className="label">Description</span>
        <textarea
          className="input min-h-[4rem]"
          rows={2}
          placeholder="Optional details"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button onClick={add} disabled={pending} className="btn-primary">
          Add Item
        </button>
        <button onClick={() => setOpen(false)} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
