import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type StaffRole = "admin" | "carpenter" | null;

export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<StaffRole | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRole(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "carpenter"] as never);
      if (cancelled) return;
      const roles = (data ?? []).map((r: { role: string }) => r.role);
      if (roles.includes("admin")) setRole("admin");
      else if (roles.includes("carpenter")) setRole("carpenter");
      else setRole(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const isAdmin = role === "admin";
  const isCarpenter = role === "carpenter";
  const isStaff = isAdmin || isCarpenter;
  return {
    isAdmin,
    isCarpenter,
    isStaff,
    role: role ?? null,
    loading: authLoading || role === undefined,
  };
}