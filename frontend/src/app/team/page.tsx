"use client";

// /team — developer roster (team decision 2026-07-17: give this page real content
// instead of a placeholder). Lists developers from GET /developers via
// api.getEmployees. Any authenticated user can view it.
import { useCallback, useEffect, useState } from "react";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { api, ApiClientError } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import type { Employee } from "@/types";

function TeamBody() {
  const [developers, setDevelopers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDevelopers(await api.getEmployees("developer"));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load the team.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1 style={{ color: "var(--navy)", fontSize: "1.5rem", marginBottom: "1.25rem" }}>Team</h1>

      {loading ? (
        <LoadingState label="Loading the team…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : developers.length === 0 ? (
        <EmptyState title="No developers yet" message="Developers will appear here as they join." />
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {developers.map((dev) => (
            <div
              key={dev.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0.85rem 1rem",
                background: "var(--surface)",
                border: "1px solid var(--light-gray)",
                borderRadius: 10,
              }}
            >
              <Avatar name={dev.name} size={40} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: "var(--navy)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {dev.name}
                </div>
                <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                  {dev.designation || "Developer"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  const user = useAppSelector((s) => s.auth.user);
  return (
    <RouteGuard>
      <AppShell userName={user?.name}>
        <TeamBody />
      </AppShell>
    </RouteGuard>
  );
}