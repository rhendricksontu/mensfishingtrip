"use client";

import { useRef } from "react";

// A lightweight contentEditable rich-text field. Pasting from Word/Docs keeps
// bold, italic, underline, color, and lists; it's sanitized on save.
export default function RichTextEditor({
  defaultHtml,
  onChange,
  onBlurSave,
  placeholder,
}: {
  defaultHtml: string;
  onChange?: (html: string) => void;
  onBlurSave?: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dirty = useRef(false);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      data-placeholder={placeholder}
      onInput={() => {
        dirty.current = true;
        onChange?.(ref.current?.innerHTML ?? "");
      }}
      onBlur={() => {
        if (!dirty.current) return;
        dirty.current = false;
        onBlurSave?.(ref.current?.innerHTML ?? "");
      }}
      dangerouslySetInnerHTML={{ __html: defaultHtml }}
      className="notes-rich input min-h-[8rem] overflow-auto"
    />
  );
}
