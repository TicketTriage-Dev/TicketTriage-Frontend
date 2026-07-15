// Avatar — letter avatar (initials in a colored circle). Used in the top bar and
// as the assignee marker on ticket cards. Pure presentational (prop-driven).
import type { CSSProperties } from "react";

export interface AvatarProps {
  /** Full name — initials are derived from this. */
  name: string;
  /** Diameter in px. */
  size?: number;
  /** Circle background (defaults to the navy brand color). */
  background?: string;
}

/** Up to two initials: "Parinita Dutta" -> "PD", "Soham" -> "S", "" -> "?". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ name, size = 36, background = "var(--navy)" }: AvatarProps) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: size,
    height: size,
    borderRadius: "50%",
    background,
    color: "#fff",
    fontWeight: 600,
    fontFamily: "var(--font-space-grotesk)",
    fontSize: size * 0.4,
    lineHeight: 1,
    flexShrink: 0,
    userSelect: "none",
  };

  return (
    <span style={style} title={name} role="img" aria-label={name}>
      {initials(name)}
    </span>
  );
}
