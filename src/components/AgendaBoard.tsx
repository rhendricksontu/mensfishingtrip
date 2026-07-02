"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DAY_LABELS, TRIP_DAYS } from "@/lib/config";
import { shortenPlace } from "@/lib/utils";
import MapLink from "@/components/MapLink";
import RichTextEditor from "@/components/RichTextEditor";
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

const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i;
const isImage = (name: string) => IMAGE_RE.test(name);

// Office docs don't render in a phone browser. Open them in the Microsoft
// Office web viewer (no app needed) instead of a raw download.
const OFFICE_RE = /\.(docx?|pptx?|xlsx?)$/i;
function fileHref(f: AgendaFile): string {
  return OFFICE_RE.test(f.name)
    ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(f.url)}`
    : f.url;
}

// Downscale + compress photos in the browser before upload so song sheets are
// small (~150-300 KB) and load fast for the whole group on weak signal.
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.82)
    );
    if (!blob || blob.size >= file.size) return file; // keep original if no win
    const base = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
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
  const [showNotes, setShowNotes] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    e.target.value = "";
    start(async () => {
      const file = await compressImage(raw);
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadAgendaFile(item.id, fd);
      if (res && !res.ok) alert(res.error ?? "Upload failed.");
      router.refresh();
    });
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
          <span className="label">Location Name</span>
          <input
            className="input"
            defaultValue={item.location_name ?? ""}
            placeholder="Mountain Fork Park"
            onBlur={(e) =>
              e.target.value.trim() !== (item.location_name ?? "") &&
              run(() => updateAgendaItem(item.id, { location_name: e.target.value.trim() || null }))
            }
          />
        </div>
        <div>
          <span className="label">Address</span>
          <input
            className="input"
            defaultValue={item.location ?? ""}
            placeholder="Beavers Bend Rd, Broken Bow, OK 74728"
            onBlur={(e) =>
              e.target.value.trim() !== (item.location ?? "") &&
              run(() => updateAgendaItem(item.id, { location: e.target.value.trim() || null }))
            }
          />
        </div>
        <div>
          <span className="label">Notes (lyrics, lesson text, etc.)</span>
          <RichTextEditor
            defaultHtml={item.notes ?? ""}
            placeholder="Paste or type here — formatting (bold, lists, color) is kept."
            onBlurSave={(html) => run(() => updateAgendaItem(item.id, { notes: html || null }))}
          />
          <p className="mt-1 text-xs text-brand-400">
            Paste from Word or Docs to keep formatting. Loads instantly for everyone.
          </p>
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
    <li className={`card ${pending ? "opacity-60" : ""}`}>
      <div className="flex gap-4">
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
          {(() => {
            const addr = item.location ? shortenPlace(item.location) : "";
            const label = [item.location_name, addr].filter(Boolean).join(" · ");
            if (!label) return null;
            return item.location && /\d/.test(item.location) ? (
              <MapLink
                place={item.location}
                className="mt-1 inline-block text-xs font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
              >
                {label}
              </MapLink>
            ) : (
              <p className="mt-1 text-xs font-medium text-brand-500">{label}</p>
            );
          })()}
          {(item.notes || files.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.notes && (
                <button
                  type="button"
                  onClick={() => setShowNotes((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
                >
                  {showNotes ? "Hide Notes" : "Show Notes"}
                </button>
              )}
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowFiles((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
                >
                  {showFiles ? "Hide Attachments" : `Show Attachments (${files.length})`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded panels span the full width of the card */}
      {showNotes && item.notes && (
        <div
          className="notes-rich mt-3 text-sm text-brand-700"
          dangerouslySetInnerHTML={{ __html: item.notes }}
        />
      )}
      {showFiles && files.length > 0 && (
        <div className="mt-3 space-y-3">
          {files.map((f) =>
            isImage(f.name) ? (
              <div key={f.id} className="relative">
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.url}
                    alt={f.name}
                    loading="lazy"
                    className="mx-auto block max-h-[80vh] max-w-full rounded-lg border border-brand-100"
                  />
                </a>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove ${f.name}?`)) run(() => deleteAgendaFile(f.id));
                    }}
                    className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-red-600 shadow ring-1 ring-brand-200 hover:bg-white"
                  >
                    Remove
                  </button>
                )}
              </div>
            ) : (
              <div key={f.id} className="flex items-center justify-between gap-2">
                <a
                  href={fileHref(f)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
                >
                  📎 {f.name}
                </a>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove ${f.name}?`)) run(() => deleteAgendaFile(f.id));
                    }}
                    className="shrink-0 text-xs text-brand-400 underline hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}
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
  const [locName, setLocName] = useState("");
  const [loc, setLoc] = useState("");
  const [notes, setNotes] = useState("");

  function add() {
    if (!title.trim()) return;
    start(async () => {
      await createAgendaItem(day, {
        start_time: time.trim() || null,
        title: title.trim(),
        description: desc.trim() || null,
        location_name: locName.trim() || null,
        location: loc.trim() || null,
        notes: notes.trim() || null,
      });
      setTime("");
      setTitle("");
      setDesc("");
      setLocName("");
      setLoc("");
      setNotes("");
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
      <div>
        <span className="label">Location Name</span>
        <input
          className="input"
          placeholder="Mountain Fork Park"
          value={locName}
          onChange={(e) => setLocName(e.target.value)}
        />
      </div>
      <div>
        <span className="label">Address</span>
        <input
          className="input"
          placeholder="Beavers Bend Rd, Broken Bow, OK 74728"
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
        />
      </div>
      <div>
        <span className="label">Notes (lyrics, lesson text, etc.)</span>
        <RichTextEditor
          defaultHtml=""
          placeholder="Paste or type here — formatting (bold, lists, color) is kept."
          onChange={setNotes}
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
