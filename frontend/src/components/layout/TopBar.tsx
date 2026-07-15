"use client";

import { Form } from "react-bootstrap";

interface TopBarProps {
  /** Current user's name — drives the letter avatar. Wired to auth later. */
  userName?: string;
}

/**
 * Top bar with search + letter avatar. Skeleton — Parinita owns the final visuals.
 */
export function TopBar({ userName = "?" }: TopBarProps) {
  const initial = userName.charAt(0).toUpperCase() || "?";

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
      <Form.Control
        type="search"
        placeholder="Search tickets…"
        style={{ maxWidth: 320 }}
        aria-label="Search tickets"
      />
      <div style={{ marginLeft: "auto" }}>
        <span
          title={userName}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--navy)",
            color: "#fff",
            fontWeight: 600,
            fontFamily: "var(--font-space-grotesk)",
          }}
        >
          {initial}
        </span>
      </div>
    </header>
  );
}
