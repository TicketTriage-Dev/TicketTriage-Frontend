"use client";

import { Form } from "react-bootstrap";
import { Avatar } from "@/components/ui/Avatar";

interface TopBarProps {
  /** Current user's name — drives the letter avatar + label. Wired to auth later. */
  userName?: string;
}

/** Top bar: search box (with icon) on the left, current-user avatar on the right. */
export function TopBar({ userName }: TopBarProps) {
  const name = userName?.trim() ?? "";

  return (
    <header
      style={{
        height: 60,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0 1.25rem",
        background: "var(--surface)",
        borderBottom: "1px solid var(--light-gray)",
      }}
    >
      <div style={{ position: "relative", width: "100%", maxWidth: 340 }}>
        <svg
          width={16}
          height={16}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 11,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#8a8f98",
            pointerEvents: "none",
          }}
        >
          <circle cx="7" cy="7" r="4.5" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" strokeLinecap="round" />
        </svg>
        <Form.Control
          type="search"
          placeholder="Search tickets…"
          aria-label="Search tickets"
          style={{ paddingLeft: 34 }}
        />
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {name && (
          <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--navy)" }}>{name}</span>
        )}
        <Avatar name={name || "?"} size={36} />
      </div>
    </header>
  );
}