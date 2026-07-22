"use client";

import { useState } from "react";
import type { Team, UpdateRow } from "../types";
import { buildCollatedMessage } from "@/lib/collate";

type Props = {
  teams: Team[];
  updates: UpdateRow[];
};

// The PM's one-click artifact: the full collated message for ALL teams/people,
// with a Copy All button.
export default function CollatedMessage({ teams, updates }: Props) {
  const [copied, setCopied] = useState(false);
  const message = buildCollatedMessage({ teams, updates });

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Fallback for browsers/contexts without the async clipboard API.
      const ta = document.createElement("textarea");
      ta.value = message;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="panel">
      <div className="row between" style={{ marginBottom: 12 }}>
        <strong>Collated WhatsApp message</strong>
        <button className="btn small" style={{ background: "var(--green)" }} onClick={copyAll}>
          {copied ? "✓ Copied all" : "Copy all"}
        </button>
      </div>
      <div className="collated">{message}</div>
      <p className="note">
        Copies every team&apos;s updates as one message, ready to paste into WhatsApp.
      </p>
    </div>
  );
}
