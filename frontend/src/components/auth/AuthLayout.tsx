import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Footer row, e.g. the "Don't have an account? Register" switch link. */
  footer?: ReactNode;
}

/**
 * Shared two-column auth chrome: a navy brand panel (hidden on small screens)
 * beside a centered form card. Used by both /login and /register so the pages
 * stay in sync. Pure layout — reuses palette tokens, no new primitives.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* Brand panel */}
      <div
        className="d-none d-lg-flex"
        style={{
          width: "42%",
          background: "linear-gradient(160deg, #001f3f 0%, #013a76 100%)",
          color: "#fff",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "3rem",
        }}
      >
        <div style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 700, fontSize: "1.5rem" }}>
          Ticket<span style={{ color: "var(--gold)" }}>Matchr</span>
        </div>

        <div>
          <div aria-hidden="true" style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
            {[0, 1, 2].map((i) => (
              <svg key={i} width={28} height={28} viewBox="0 0 16 16" fill="var(--gold)">
                <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z" />
              </svg>
            ))}
          </div>
          <h2
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 700,
              fontSize: "1.9rem",
              lineHeight: 1.25,
              maxWidth: 380,
            }}
          >
            Triage tickets, the way your team actually works.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", marginTop: "0.75rem", maxWidth: 360 }}>
            Raise, assign, and track work across your dev team — from one clean board.
          </p>
        </div>

        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>
          © {" "}TicketMatchr
        </div>
      </div>

      {/* Form side */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--light-gray)",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "var(--surface)",
            border: "1px solid var(--light-gray)",
            borderRadius: 16,
            padding: "2.25rem",
            boxShadow: "0 8px 30px rgba(0, 31, 63, 0.10)",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "var(--navy)",
              marginBottom: subtitle ? 4 : "1.5rem",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              {subtitle}
            </p>
          )}

          {children}

          {footer && (
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1.25rem",
                borderTop: "1px solid var(--light-gray)",
                textAlign: "center",
                fontSize: "0.9rem",
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
