"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { appendItems, detectListStyle, STARTER_PHRASES } from "@/lib/editor";

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

export type UpdateEditorHandle = {
  // Append items as new list lines at the end, continuing the current style.
  appendItems: (items: string[], opts?: { keepVerbatimWhenEmpty?: boolean }) => void;
};

// Plain-text multiline editor. Newlines and manual bullets are preserved and
// map cleanly to WhatsApp. Enter inserts a newline (default textarea behavior).
const UpdateEditor = forwardRef<UpdateEditorHandle, Props>(function UpdateEditor(
  { value, onChange, disabled },
  ref
) {
  const areaRef = useRef<HTMLTextAreaElement>(null);

  function caretToEnd() {
    requestAnimationFrame(() => {
      const el = areaRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
      el.scrollTop = el.scrollHeight;
    });
  }

  // Append helper used by chips (internal) and the parent (yesterday's update).
  function append(items: string[], opts?: { keepVerbatimWhenEmpty?: boolean }) {
    onChange(appendItems(value, items, opts));
    caretToEnd();
  }

  useImperativeHandle(ref, () => ({ appendItems: append }), [value]);

  function insertBullet() {
    // Adds a fresh empty bullet line at the end, continuing the current style.
    const base = value.replace(/\s+$/, "");
    const style =
      base.length === 0
        ? { kind: "bullet" as const, bulletChar: "•", nextNumber: 1 }
        : detectListStyle(base);
    const marker =
      style.kind === "ordered" ? `${style.nextNumber}. ` : `${style.bulletChar} `;
    onChange(base.length === 0 ? marker : `${base}\n${marker}`);
    caretToEnd();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // When pressing Enter on a bulleted line, start the next line with a bullet.
    if (e.key === "Enter" && !e.shiftKey) {
      const el = areaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const currentLine = value.slice(lineStart, start);
      if (currentLine.trimStart().startsWith("•")) {
        e.preventDefault();
        if (currentLine.trim() === "•") {
          const next = value.slice(0, lineStart) + value.slice(start);
          onChange(next);
          requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(lineStart, lineStart);
          });
          return;
        }
        const insert = "\n• ";
        const next = value.slice(0, start) + insert + value.slice(start);
        onChange(next);
        requestAnimationFrame(() => {
          const pos = start + insert.length;
          el.focus();
          el.setSelectionRange(pos, pos);
        });
      }
    }
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 8 }}>
        <button
          type="button"
          className="btn secondary small"
          onClick={insertBullet}
          disabled={disabled}
        >
          • Add bullet
        </button>
        <span className="note" style={{ marginTop: 0 }}>
          Tap a starter to add a bullet, then edit it.
        </span>
      </div>

      <div className="chips" style={{ marginBottom: 10 }}>
        <button
          type="button"
          className="chip leave"
          disabled={disabled}
          onClick={() => append(["On leave"])}
        >
          On leave
        </button>
        {STARTER_PHRASES.map((p) => (
          <button
            key={p}
            type="button"
            className="chip"
            disabled={disabled}
            onClick={() => append([`${p} `])}
          >
            {p}
          </button>
        ))}
      </div>

      <textarea
        ref={areaRef}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={"• Worked on…\n• Tested…"}
      />
    </div>
  );
});

export default UpdateEditor;
