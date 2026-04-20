import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function WishlistButton({ productId }: { productId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setActive(false); return; }
    supabase
      .from("wishlist_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle()
      .then(({ data }) => setActive(!!data));
  }, [user, productId]);

  const toggle = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setLoading(true);
    if (active) {
      await supabase.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", productId);
      setActive(false);
      toast("Removed from wishlist");
    } else {
      const { error } = await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: productId });
      if (!error) { setActive(true); toast.success("Saved to wishlist"); }
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label="Toggle wishlist"
      className="flex h-12 w-12 items-center justify-center rounded-md border border-border hover:bg-muted transition-colors"
    >
      <Heart className={`h-5 w-5 ${active ? "fill-destructive text-destructive" : ""}`} />
    </button>
  );
}
