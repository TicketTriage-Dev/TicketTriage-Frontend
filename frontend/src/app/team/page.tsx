"use client";

// /team — placeholder page reached from the sidebar. Any authenticated user.
import { RouteGuard } from "@/components/auth/RouteGuard";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/States";
import { useAppSelector } from "@/store/hooks";

export default function TeamPage() {
  const user = useAppSelector((s) => s.auth.user);
  return (
    <RouteGuard>
      <AppShell userName={user?.name}>
        <h1 style={{ color: "var(--navy)", fontSize: "1.5rem", marginBottom: "1.25rem" }}>Team</h1>
        <EmptyState
          title="Team directory coming soon"
          message="A placeholder for now — the team roster will live here."
        />
      </AppShell>
    </RouteGuard>
  );
}
