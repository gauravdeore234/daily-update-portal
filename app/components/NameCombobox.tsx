"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Member, Team } from "../types";

type Props = {
  members: Member[];
  teams?: Team[];
  value: string | null; // selected member id
  onChange: (memberId: string | null) => void;
  disabled?: boolean;
};

// Search-as-you-type combobox over the full active roster. Each option shows a
// muted role hint (the member's team) for confirmation.
export default function NameCombobox({ members, teams, value, onChange, disabled }: Props) {
  const teamName = (teamId: string) =>
    teams?.find((t) => t.id === teamId)?.name ?? "";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = members.find((m) => m.id === value) ?? null;

  // Keep the input text in sync with an external selection.
  useEffect(() => {
    setQuery(selected ? selected.name : "");
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || (selected && q === selected.name.toLowerCase())) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [query, members, selected]);

  // Close on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(m: Member) {
    onChange(m.id);
    setQuery(m.name);
    setOpen(false);
  }

  return (
    <div className="combo" ref={boxRef}>
      <input
        type="text"
        placeholder={disabled ? "Submissions are closed" : "Type your name…"}
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIdx(0);
          if (value) onChange(null); // typing clears the previous pick
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[activeIdx]) pick(filtered[activeIdx]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        autoComplete="off"
      />
      {open && !disabled && (
        <div className="combo-list">
          {filtered.length === 0 ? (
            <div className="combo-empty">No matching name</div>
          ) : (
            filtered.map((m, i) => (
              <div
                key={m.id}
                className={`combo-option ${i === activeIdx ? "active" : ""}`}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(m);
                }}
              >
                <span>{m.name}</span>
                {teamName(m.team_id) && (
                  <span style={{ float: "right", opacity: 0.7, fontSize: "0.85em" }}>
                    {teamName(m.team_id)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
