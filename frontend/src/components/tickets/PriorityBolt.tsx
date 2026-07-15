// PriorityBolt — the app's signature element (CLAUDE.md §3): priority shown as
// 1/2/3 gold lightning bolts for normal/urgent/severe. Pure presentational.
import type { Priority } from "@/types";
import { PRIORITIES, PRIORITY_BOLTS } from "@/constants";

export interface PriorityBoltProps {
  /** Ticket priority — drives how many bolts render. */
  priority: Priority;
  /** Show the priority label text after the bolts. */
  showLabel?: boolean;
  /** Bolt size in px. */
  size?: number;
}

const LABELS = Object.fromEntries(
  PRIORITIES.map((p) => [p.value, p.label]),
) as Record<Priority, string>;

/** Bootstrap Icons "lightning-fill" glyph, filled with the gold accent. */
function Bolt({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="var(--gold)"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z" />
    </svg>
  );
}

export function PriorityBolt({ priority, showLabel = false, size = 16 }: PriorityBoltProps) {
  const count = PRIORITY_BOLTS[priority];
  const label = LABELS[priority];

  return (
    <span
      className="d-inline-flex align-items-center"
      style={{ gap: 1 }}
      role="img"
      aria-label={`Priority: ${label}`}
      title={`${label} priority`}
    >
      {Array.from({ length: count }, (_, i) => (
        <Bolt key={i} size={size} />
      ))}
      {showLabel && (
        <span className="ms-1" style={{ fontSize: "0.8rem", color: "var(--navy)" }}>
          {label}
        </span>
      )}
    </span>
  );
}
