import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthNS = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const authOAuth = (supabase.auth as unknown as { oauth: OAuthNS }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } as never });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await authOAuth.getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="font-serif text-2xl mb-3">Authorization error</h1>
      <p className="text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData() as any;
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await authOAuth.approveAuthorization(authorization_id)
      : await authOAuth.denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message ?? String(error)); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("No redirect returned by the authorization server."); return; }
    window.location.href = target;
  }

  const clientName: string = details?.client?.name ?? "an application";

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md bg-background border rounded-2xl shadow-elegant p-8 space-y-5">
        <div>
          <h1 className="font-serif text-2xl">Connect {clientName} to Suzy Wood</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {clientName} will be able to call this app's enabled tools while you are signed in.
            This does not bypass Suzy Wood's permissions or backend policies.
          </p>
        </div>
        {details?.client?.redirect_uris?.length ? (
          <div className="text-xs text-muted-foreground">
            Redirects to: <span className="font-mono">{details.client.redirect_uris[0]}</span>
          </div>
        ) : null}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
            {busy ? "Working…" : "Approve"}
          </Button>
          <Button disabled={busy} onClick={() => decide(false)} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </main>
  );
}