import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/admin";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Suzy Wood" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminGate,
});

function AdminGate() {
  const { user, loading: authLoading } = useAuth();
  const { isStaff, loading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/admin/login", replace: true });
      return;
    }
    if (!loading && !isStaff) {
      navigate({ to: "/admin/login", replace: true });
    }
  }, [user, authLoading, isStaff, loading, navigate]);

  if (authLoading || loading || !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}