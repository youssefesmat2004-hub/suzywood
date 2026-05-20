import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MessageCircle, Check, Trash2, MailOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({ meta: [{ title: "Messages — Suzy Wood Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminMessages,
});

type Msg = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

function AdminMessages() {
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Couldn't load messages");
    else setRows((data ?? []) as Msg[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("messages-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleRead = async (m: Msg) => {
    const next = !m.is_read;
    setRows((r) => r.map((x) => (x.id === m.id ? { ...x, is_read: next } : x)));
    const { error } = await supabase.from("contact_messages").update({ is_read: next }).eq("id", m.id);
    if (error) { toast.error(error.message); load(); }
  };

  const remove = async (m: Msg) => {
    if (!confirm(`Delete message from ${m.full_name}?`)) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    setRows((r) => r.filter((x) => x.id !== m.id));
    toast.success("Message deleted");
  };

  const unreadCount = rows.filter((r) => !r.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customer contact-form submissions{unreadCount > 0 && ` — ${unreadCount} unread`}.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">No messages yet.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((m) => (
            <div key={m.id} className={`rounded-xl border bg-card p-5 ${!m.is_read ? "border-primary/40 bg-primary/5" : ""}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-lg">{m.full_name}</h3>
                    {!m.is_read && <Badge className="bg-primary text-primary-foreground">New</Badge>}
                    <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex gap-4 flex-wrap">
                    <a href={`mailto:${m.email}`} className="hover:text-primary inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {m.email}
                    </a>
                    {m.phone && (
                      <a href={`tel:${m.phone}`} className="hover:text-primary inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {m.phone}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {m.phone && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`https://wa.me/${m.phone.replace(/[^0-9]/g, "").replace(/^0/, "2")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => toggleRead(m)} title={m.is_read ? "Mark unread" : "Mark read"}>
                    {m.is_read ? <MailOpen className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(m)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}