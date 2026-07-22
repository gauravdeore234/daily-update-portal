"use client";

import { useState } from "react";
import type { Team, UpdateRow } from "../types";
import { buildGroupedMessages } from "@/lib/collate";

type Props = {
  teams: Team[];
  updates: UpdateRow[];
};

// Two separate WhatsApp-ready messages, each with its own Copy button:
//   1. Developers + Testers
//   2. PMs
export default function CollatedMessage({ teams, updates }: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const groups = buildGroupedMessages({ teams, updates });

  async function copy(key: string, message: string) {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = message;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
  }

  return (
    <>
      {groups.map((g) => (
        <div className="panel" key={g.key}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <strong>WhatsApp message — {g.label}</strong>
            <button
              className="btn small"
              style={{ background: "var(--green)" }}
              onClick={() => copy(g.key, g.message)}
            >
              {copiedKey === g.key ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <div className="collated">{g.message}</div>
        </div>
      ))}
      <p className="note" style={{ marginTop: -4 }}>
        Two messages: one for Developers + Testers, one for PMs. Copy each and
        paste into WhatsApp.
      </p>
    </>
  );
}
