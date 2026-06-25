# Fix VAPID key error

The current `VAPID_PRIVATE_KEY` is in raw base64url format, but `src/lib/web-push.server.ts` expects a JSON-stringified JWK. I'll generate a fresh, correctly-formatted pair.

## Steps

1. Generate a new P-256 ECDSA keypair using Web Crypto in a one-off script.
2. Export:
   - Public key: raw base64url (65 bytes, `0x04||x||y`)
   - Private key: JWK exported as JSON string
3. Use `update_secret` to replace both `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in Lovable Cloud secrets (secure form, you paste the generated values).
4. No code changes needed — `web-push.server.ts` already reads from env.

## After the fix

- Any device that previously subscribed (none should have, since setup was failing) would need to re-subscribe — the public key is changing.
- You re-open the admin panel on your phone and tap **Enable notifications**; it should succeed.

## Note

I can't directly run a script in plan mode. Once you approve, I'll run the keygen in build mode and walk you through pasting the two values into the secret form.
