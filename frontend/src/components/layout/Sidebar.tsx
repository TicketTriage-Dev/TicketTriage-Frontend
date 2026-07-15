"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/constants";

/**
 * Slim left navigation. Skeleton — Parinita owns the final visuals.
 * Navy surface, gold active state (palette per CLAUDE.md §3).
 */
export function Sidebar() {
  const pathname = usePathname();

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
        gap: "0.25rem",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-space-grotesk)",
          fontWeight: 700,
          fontSize: "1.15rem",
          padding: "0 0.75rem 1rem",
        }}
      >
        Ticket<span style={{ color: "var(--gold)" }}>Matchr</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "block",
              padding: "0.55rem 0.75rem",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 500,
              color: active ? "var(--navy)" : "rgba(255,255,255,0.85)",
              background: active ? "var(--gold)" : "transparent",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
