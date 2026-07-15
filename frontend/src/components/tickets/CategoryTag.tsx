// CategoryTag — GitHub-issue-style category label: a small pill with a colored
// dot. The category is chosen at ticket creation. Pure presentational.

export interface CategoryTagProps {
  /** Category name, e.g. "Frontend". */
  name: string;
  /** Dot color (defaults to the gold accent). */
  color?: string;
}

export function CategoryTag({ name, color = "var(--gold)" }: CategoryTagProps) {
  return (
    <span
      className="d-inline-flex align-items-center"
      style={{
        gap: 6,
        padding: "2px 10px",
        borderRadius: 999,
        border: "1px solid var(--light-gray)",
        background: "#f6f6f6",
        color: "var(--navy)",
        fontSize: "0.75rem",
        fontWeight: 500,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }}
      />
      {name}
    </span>
  );
}
