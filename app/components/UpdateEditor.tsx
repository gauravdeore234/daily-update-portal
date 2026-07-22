"use client";

import { useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

// Plain-text multiline editor. Newlines and manual bullets are preserved and
// map cleanly to WhatsApp. Enter inserts a newline (default textarea behavior).
export default function UpdateEditor({ value, onChange, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function insertBullet() {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    // Add a leading newline unless we're at the start of a line.
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const bullet = `${needsNewline ? "\n" : ""}• `;
    const next = before + bullet + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      const pos = start + bullet.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // When pressing Enter on a bulleted line, start the next line with a bullet.
    if (e.key === "Enter" && !e.shiftKey) {
      const el = ref.current;
      if (!el) return;
      const start = el.selectionStart;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const currentLine = value.slice(lineStart, start);
      if (currentLine.trimStart().startsWith("•")) {
        e.preventDefault();
        // If the bullet line is empty, exit the bullet list instead.
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
          Press Enter for a new line. Bullets continue automatically.
        </span>
      </div>
      <textarea
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={"• Worked on…\n• Tested…"}
      />
    </div>
  );
}
