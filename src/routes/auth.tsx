import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or Create Account — Suzy Wood" },
      { name: "description", content: "Sign in to your Suzy Wood account to track orders, manage your wishlist and save delivery details — or create a new account in seconds." },
      { property: "og:title", content: "Sign in or Create Account — Suzy Wood" },
      { property: "og:description", content: "Access your Suzy Wood account to track orders and manage your wishlist." },
      { property: "og:url", content: "https://suzywoodofficial.com/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://suzywoodofficial.com/auth" }],
  }),
  component: Auth,
});

function Auth() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/auth" });
  // Only same-origin relative paths allowed.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const [loading, setLoading] = useState(false);

  const onSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await signIn(String(fd.get("email")), String(fd.get("password")));
    setLoading(false);
    if (error) toast.error(error);
    else {
      toast.success("Welcome back");
      if (safeNext) window.location.href = safeNext;
      else navigate({ to: "/account" });
    }
  };

  const onSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await signUp(
      String(fd.get("email")),
      String(fd.get("password")),
      String(fd.get("full_name")),
      String(fd.get("phone")),
    );
    setLoading(false);
    if (error) toast.error(error);
    else {
      toast.success("Account created");
      if (safeNext) window.location.href = safeNext;
      else navigate({ to: "/account" });
    }
  };

  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 py-20 max-w-md">
        <h1 className="font-serif text-4xl mb-8 text-center">Your Account</h1>
        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={onSignIn} className="space-y-4 mt-6">
              <div className="space-y-1"><Label htmlFor="si-email">Email</Label><Input id="si-email" type="email" name="email" required /></div>
              <div className="space-y-1"><Label htmlFor="si-pw">Password</Label><Input id="si-pw" type="password" name="password" required minLength={6} /></div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? "Signing in…" : "Sign In"}</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={onSignUp} className="space-y-4 mt-6">
              <div className="space-y-1"><Label htmlFor="su-name">Full name</Label><Input id="su-name" name="full_name" required maxLength={100} /></div>
              <div className="space-y-1"><Label htmlFor="su-phone">Phone</Label><Input id="su-phone" name="phone" type="tel" required maxLength={20} /></div>
              <div className="space-y-1"><Label htmlFor="su-email">Email</Label><Input id="su-email" type="email" name="email" required /></div>
              <div className="space-y-1"><Label htmlFor="su-pw">Password (min 8 chars)</Label><Input id="su-pw" type="password" name="password" required minLength={8} /></div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? "Creating…" : "Create Account"}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
}
