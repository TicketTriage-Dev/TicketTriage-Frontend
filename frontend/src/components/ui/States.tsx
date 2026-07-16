// Shared feedback states — Loading / Empty / Error. Used by data-backed views
// (e.g. /queue) so every screen handles the three non-happy paths consistently.
// Presentational; the parent decides which one to show.
import type { CSSProperties, ReactNode } from "react";
import { Spinner } from "react-bootstrap";
import { Button } from "./Button";

const wrap: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "2.5rem 1.5rem",
  gap: "0.5rem",
};

const titleStyle: CSSProperties = {
  fontFamily: "var(--font-space-grotesk)",
  fontWeight: 600,
  color: "var(--navy)",
};

const messageStyle: CSSProperties = { fontSize: "0.9rem", maxWidth: 360 };

export interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div style={wrap} role="status" aria-live="polite">
      <Spinner animation="border" style={{ color: "var(--navy)" }} />
      <div className="text-muted" style={{ fontSize: "0.9rem" }}>
        {label}
      </div>
    </div>
  );
}

export interface EmptyStateProps {
  title?: string;
  message?: ReactNode;
  /** Override the default icon. */
  icon?: ReactNode;
  /** Optional CTA (e.g. a Button). */
  action?: ReactNode;
}

export function EmptyState({ title = "Nothing here yet", message, icon, action }: EmptyStateProps) {
  return (
    <div style={wrap}>
      {icon ?? <EmptyIcon />}
      <div style={titleStyle}>{title}</div>
      {message && (
        <div className="text-muted" style={messageStyle}>
          {message}
        </div>
      )}
      {action && <div style={{ marginTop: "0.5rem" }}>{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: ReactNode;
  /** Show a "Try again" button wired to this handler. */
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div style={wrap} role="alert">
      <ErrorIcon />
      <div style={titleStyle}>{title}</div>
      {message && (
        <div className="text-muted" style={messageStyle}>
          {message}
        </div>
      )}
      {onRetry && (
        <Button variant="outline-primary" size="sm" onClick={onRetry} style={{ marginTop: "0.5rem" }}>
          Try again
        </Button>
      )}
    </div>
  );
}

// --- icons ------------------------------------------------------------------

function EmptyIcon() {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: "rgba(0,31,63,0.3)" }}
    >
      <path d="M4 5h16v14H4z" />
      <path d="M4 14h4l1.5 2h5L16 14h4" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: "#dc3545" }}
    >
      <path d="M12 3l9 16H3z" />
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
    </svg>
  );
}
