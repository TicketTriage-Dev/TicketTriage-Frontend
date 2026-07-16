"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { restoreSession } from "@/store/authSlice";
import { HOME_BY_ROLE } from "@/constants";
import type { Role } from "@/types";

/**
 * Wraps authenticated pages. On mount it restores the session (cookie → /auth/me,
 * auto-refreshing if the access token expired). Redirects to /login when there's
 * no session, and — if `roles` is given — bounces users whose role isn't allowed
 * back to their own home page.
 */
export function RouteGuard({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, status } = useAppSelector((s) => s.auth);

  // Kick off the session check once.
  useEffect(() => {
    if (status === "idle") dispatch(restoreSession());
  }, [status, dispatch]);

  // React to the resolved auth state.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (user && roles && !roles.includes(user.role)) {
      router.replace(HOME_BY_ROLE[user.role]);
    }
  }, [status, user, roles, router]);

  const allowed = status === "authenticated" && (!roles || (user != null && roles.includes(user.role)));

  if (!allowed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner animation="border" style={{ color: "var(--navy)" }} role="status" />
      </div>
    );
  }

  return <>{children}</>;
}
