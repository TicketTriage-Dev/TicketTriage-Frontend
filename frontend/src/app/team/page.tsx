"use client";

// /team — developer roster (team decision 2026-07-17: real content, not a
// placeholder). Lists developers from GET /developers via api.getEmployees.
// Any authenticated user can view it.
import { useCallback, useEffect, useState } from "react";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { AppShell } from "@/components/layout/AppShell";
import { CategoryTag } from "@/components/tickets/CategoryTag";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { api, ApiClientError } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import type { Employee } from "@/types";

function TeamBody() {
  const [developers, setDevelopers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

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
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: "1.25rem" }}>
        <h1 style={{ color: "var(--navy)", fontSize: "1.5rem", margin: 0 }}>Team</h1>
        {!loading && !error && developers.length > 0 && (
          <span className="text-muted" style={{ fontSize: "0.9rem" }}>
            {developers.length} developer{developers.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

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
            gap: 14,
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          }}
        >
          {developers.map((dev) => {
            const hover = hoveredId === dev.id;
            return (
              <div
                key={dev.id}
                onMouseEnter={() => setHoveredId(dev.id)}
                onMouseLeave={() => setHoveredId((h) => (h === dev.id ? null : h))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "1rem",
                  background: "var(--surface)",
                  border: "1px solid var(--light-gray)",
                  borderRadius: 12,
                  boxShadow: hover ? "0 4px 14px rgba(0,31,63,0.10)" : "0 1px 2px rgba(0,0,0,0.05)",
                  transform: hover ? "translateY(-2px)" : "none",
                  transition: "box-shadow 0.15s ease, transform 0.15s ease",
                }}
              >
                <Avatar name={dev.name} size={52} />
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
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
                  <CategoryTag name={dev.designation || "Developer"} />
                  {dev.email && (
                    <span
                      className="text-muted"
                      style={{
                        fontSize: "0.75rem",
                        fontFamily: "var(--font-jetbrains-mono)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {dev.email}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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