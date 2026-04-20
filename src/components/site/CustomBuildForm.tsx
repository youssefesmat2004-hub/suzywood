import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function CustomBuildForm() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [room, setRoom] = useState("nursery");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("custom_build_requests").insert({
      user_id: user?.id ?? null,
      full_name: String(fd.get("name")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone")),
      room_type: room,
      description: String(fd.get("idea")),
      status: "new",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't send your request", { description: error.message });
    } else {
      toast.success("Request received", { description: "Our studio will reach out within two working days." });
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" name="name" required maxLength={100} /></div>
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" name="email" required maxLength={255} /></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" required maxLength={20} /></div>
        <div className="space-y-2">
          <Label htmlFor="room">Room type</Label>
          <Select value={room} onValueChange={setRoom}>
            <SelectTrigger id="room"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nursery">Nursery</SelectItem>
              <SelectItem value="toddler">Toddler Room</SelectItem>
              <SelectItem value="playroom">Playroom</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2"><Label htmlFor="idea">Tell us about your bespoke piece</Label><Textarea id="idea" name="idea" rows={5} minLength={10} maxLength={2000} required placeholder="Dimensions, finish, style references…" /></div>
      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">{submitting ? "Sending…" : "Submit Request"}</Button>
    </form>
  );
}
