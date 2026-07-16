import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
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
          maxWidth: 400,
          background: "var(--surface)",
          border: "1px solid var(--light-gray)",
          borderRadius: 12,
          padding: "2rem",
          boxShadow: "0 4px 24px rgba(0, 31, 63, 0.08)",
        }}
      >
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "var(--navy)",
            }}
          >
            Ticket<span style={{ color: "var(--gold)" }}>Matchr</span>
          </div>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem", marginTop: 4 }}>
            Sign in to your account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
