import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, FileEdit, LogOut, Menu, X, Tags, Settings, CalendarCheck, Ticket, Mail, MessageSquare, Hammer, Users, BarChart3, Ruler } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/measurement-bookings", label: "Measurement Bookings", icon: Ruler },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/custom-builds", label: "Custom Builds", icon: Hammer },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/promos", label: "Promo Codes", icon: Ticket },
  { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { to: "/admin/content", label: "Edit Content", icon: FileEdit },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const { isCarpenter } = useIsAdmin();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [newBuilds, setNewBuilds] = useState(0);

  useEffect(() => {
    if (isCarpenter) return;
    const load = async () => {
      const [m, b] = await Promise.all([
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("custom_build_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      ]);
      setUnreadMsgs(m.count ?? 0);
      setNewBuilds(b.count ?? 0);
    };
    load();
    const ch = supabase
      .channel("admin-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "custom_build_requests" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isCarpenter]);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/admin/login" });
  };

  const isActive = (to: string) => (to === "/admin" ? pathname === "/admin" : pathname.startsWith(to));

  const visibleNav = isCarpenter
    ? nav.filter((n) => n.to === "/admin/orders")
    : nav;

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-background border-b flex items-center justify-between px-4 h-14">
        <span className="font-serif text-lg">Suzy Wood Admin</span>
        <button onClick={() => setOpen(!open)} className="p-2"><Menu className="h-5 w-5" /></button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-background border-r flex flex-col transition-transform`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b">
          <Link to={isCarpenter ? "/admin/orders" : "/admin"} className="font-serif text-xl">Suzy Wood</Link>
          <button className="lg:hidden p-1" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            const badge =
              item.to === "/admin/messages" ? unreadMsgs :
              item.to === "/admin/custom-builds" ? newBuilds : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground/80"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${active ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"}`}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-0 pt-14 lg:pt-0 min-w-0">
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}