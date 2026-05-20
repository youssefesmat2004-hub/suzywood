import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

type Low = { id: string; name: string; stock_quantity: number };

export function LowStockBanner({ threshold = 5 }: { threshold?: number }) {
  const [items, setItems] = useState<Low[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,stock_quantity")
        .eq("is_active", true)
        .lt("stock_quantity", threshold)
        .order("stock_quantity", { ascending: true });
      setItems((data ?? []) as Low[]);
    })();
  }, [threshold]);

  if (items.length === 0) return null;

  const outCount = items.filter((i) => i.stock_quantity === 0).length;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-amber-900">
            {outCount > 0 && `${outCount} out of stock · `}
            {items.length} product{items.length === 1 ? "" : "s"} low on stock
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {items.slice(0, 8).map((i) => (
              <Link
                key={i.id}
                to="/admin/products/$id"
                params={{ id: i.id }}
                className={`text-xs px-2 py-1 rounded border ${
                  i.stock_quantity === 0
                    ? "bg-rose-100 border-rose-300 text-rose-900"
                    : "bg-white border-amber-300 text-amber-900"
                } hover:opacity-80`}
              >
                {i.name} ({i.stock_quantity})
              </Link>
            ))}
            {items.length > 8 && <span className="text-xs text-amber-700 self-center">+{items.length - 8} more</span>}
          </div>
        </div>
        <Link to="/admin/products" className="text-sm text-amber-900 underline hover:no-underline shrink-0">
          Manage →
        </Link>
      </div>
    </div>
  );
}