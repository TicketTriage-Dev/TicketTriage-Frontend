"use client";

// /team — AGENT-only developer roster, each with their current workload (count
// of non-Done assigned tickets). Workload is computed client-side from
// GET /tickets + GET /developers: the /developers/me/workload endpoint is
// "me"-only, so it can't give an agent per-developer numbers.
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
  const [workload, setWorkload] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [devs, tickets] = await Promise.all([api.getEmployees("developer"), api.getTickets()]);
      setDevelopers(devs);
      // Open workload = tickets assigned to a dev that aren't Done yet.
      const counts: Record<number, number> = {};
      for (const t of tickets) {
        if (t.assigned_to != null && t.status !== "Done") {
          counts[t.assigned_to] = (counts[t.assigned_to] ?? 0) + 1;
        }
      }
      setWorkload(counts);
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
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {developers.map((dev) => {
            const hover = hoveredId === dev.id;
            const open = workload[dev.id] ?? 0;
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
                <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
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
                <div
                  style={{ textAlign: "center", flexShrink: 0, minWidth: 44 }}
                  title={`${open} open ticket${open === 1 ? "" : "s"}`}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      fontWeight: 700,
                      fontSize: "1.15rem",
                      lineHeight: 1,
                      color: open > 0 ? "var(--navy)" : "var(--light-gray)",
                    }}
                  >
                    {open}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.7rem", marginTop: 2 }}>
                    open
                  </div>
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
    <RouteGuard roles={["agent"]}>
      <AppShell userName={user?.name}>
        <TeamBody />
      </AppShell>
    </RouteGuard>
  );
}