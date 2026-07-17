"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/constants";
import { useAppSelector } from "@/store/hooks";

// Navy sidebar with the gold active state (palette per CLAUDE.md §3). Outline
// icons are hand-built so we don't pull in an icon dependency.
const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function NavIcon({ href }: { href: string }) {
  switch (href) {
    case "/board":
      return (
        <svg {...iconProps} aria-hidden="true">
          <rect x="1.75" y="2.5" width="3.5" height="11" rx="1" />
          <rect x="6.25" y="2.5" width="3.5" height="11" rx="1" />
          <rect x="10.75" y="2.5" width="3.5" height="7" rx="1" />
        </svg>
      );
    case "/queue":
      return (
        <svg {...iconProps} aria-hidden="true">
          <path d="M3 4h10M3 8h10M3 12h10" />
        </svg>
      );
    case "/team":
      return (
        <svg {...iconProps} aria-hidden="true">
          <circle cx="8" cy="5" r="2.75" />
          <path d="M2.5 13.5c0-3 2.4-4.75 5.5-4.75s5.5 1.75 5.5 4.75" />
        </svg>
      );
    case "/settings":
      return (
        <svg {...iconProps} aria-hidden="true">
          <path d="M2 5.5h3.5M8.5 5.5h5.5" />
          <circle cx="7" cy="5.5" r="1.8" />
          <path d="M2 10.5h7.5M13 10.5h1" />
          <circle cx="11" cy="10.5" r="1.8" />
        </svg>
      );
    default:
      return null;
  }
}

export function Sidebar() {
  const pathname = usePathname() ?? "";
  const [hovered, setHovered] = useState<string | null>(null);
  const role = useAppSelector((s) => s.auth.user?.role);

  // Show only the items this role is allowed to reach (before the session
  // resolves, `role` is undefined → show all, then it settles).
  const items = NAV_ITEMS.filter((item) => !role || item.roles.includes(role));

  return (
    <nav
      style={{
        width: 220,
        flexShrink: 0,
        background: "var(--navy)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: "1.25rem 0.75rem",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-space-grotesk)",
          fontWeight: 700,
          fontSize: "1.2rem",
          padding: "0 0.75rem 1.25rem",
        }}
      >
        Ticket<span style={{ color: "var(--gold)" }}>Matchr</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const hover = hovered === item.href && !active;
          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHovered(item.href)}
              onMouseLeave={() => setHovered((h) => (h === item.href ? null : h))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.6rem 0.75rem",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.925rem",
                color: active ? "var(--navy)" : "rgba(255,255,255,0.85)",
                background: active
                  ? "var(--gold)"
                  : hover
                    ? "rgba(255,255,255,0.08)"
                    : "transparent",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              <NavIcon href={item.href} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}