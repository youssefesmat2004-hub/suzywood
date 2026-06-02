## Fix Resend 403 on order status emails

**Cause:** `src/lib/order-emails.functions.ts` sends from `onboarding@resend.dev`, Resend's shared test sender. That sender can only deliver to the Resend account owner's email, so every send to a customer returns 403.

**Fix:** Change the `from` field to use your verified domain `suzywoodofficial.com`.

### Change
In `src/lib/order-emails.functions.ts` (line 169), replace:
```
from: "Suzy Wood <onboarding@resend.dev>",
```
with:
```
from: "Suzy Wood <orders@suzywoodofficial.com>",
```

### Prerequisite (you do this in Resend)
`suzywoodofficial.com` must be added and verified in your Resend dashboard (Domains → Add Domain → add the DNS records → Verify). Until DNS shows "Verified", Resend will return 403 again.

No other code, env vars, or DB changes are needed. If you'd prefer a different local-part (e.g. `noreply@`, `hello@`), tell me before I implement.