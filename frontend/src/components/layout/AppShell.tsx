"use client";

import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/authSlice";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
}

/**
 * Shared shell: sidebar + top bar + scrollable content area.
 * Wrap authenticated pages (board, queue, team, settings) in this.
 */
export function AppShell({ children, userName }: AppShellProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  async function handleLogout() {
    await dispatch(logout());
    router.replace("/login");
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <TopBar userName={userName} onLogout={handleLogout} />
        <main style={{ flex: 1, overflow: "auto", padding: "1.5rem", background: "var(--light-gray)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
