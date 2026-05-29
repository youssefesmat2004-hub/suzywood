import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import qrImage from "@/assets/instapay-qr.jpeg";

export const Route = createFileRoute("/payment")({
  head: () => ({ meta: [
    { title: "Pay with Instapay — Suzy Wood" },
    { name: "description", content: "Pay for your Suzy Wood order via Instapay — scan the QR or send to our Instapay number." },
  ] }),
  component: PaymentPage,
});

const INSTAPAY_NUMBER = "01096313532";
const INSTAPAY_HANDLE = "axady@instapay";

function PaymentPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't copy — please copy manually");
    }
  };

  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 py-16 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Payment</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-3">Pay with Instapay</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          At checkout, the app automatically calculates your payment split: pay 75% of the
          furniture total upfront by Instapay, then pay the remaining 25% plus delivery on delivery.
          Scan the QR or transfer to the number / handle below.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-8 items-start">
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center">
            <img
              src={qrImage}
              alt="Suzy Wood Instapay QR code"
              className="w-full max-w-xs rounded-xl"
              loading="lazy"
            />
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Open your banking app → Instapay → Scan QR
            </p>
          </div>

          <div className="space-y-5">
            <div className="bg-muted/40 border border-border rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Instapay number</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-serif text-2xl">{INSTAPAY_NUMBER}</p>
                <Button variant="outline" size="sm" onClick={() => copy(INSTAPAY_NUMBER, "Number")}>
                  {copied === "Number" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-muted/40 border border-border rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Instapay handle</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-serif text-2xl">{INSTAPAY_HANDLE}</p>
                <Button variant="outline" size="sm" onClick={() => copy(INSTAPAY_HANDLE, "Handle")}>
                  {copied === "Handle" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-5 text-sm text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground mb-2">After you pay</p>
              Send the 75% upfront transfer screenshot to us on WhatsApp with your order number.
              We'll confirm receipt and start preparing your piece.
              <div className="mt-4 flex gap-3">
                <Button asChild variant="default" size="sm">
                  <a href="https://wa.me/201096313532" target="_blank" rel="noreferrer">WhatsApp us</a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/account">My orders</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}