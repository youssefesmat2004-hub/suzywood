// Pure Web Crypto Web Push implementation (RFC 8291 aes128gcm + VAPID ES256).
// Server-only — never import from a client/route file directly.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const VAPID_SUBJECT = "mailto:info@suzywoodofficial.com";

// ---------- base64url helpers ----------
function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}
function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
function utf8(s: string): Uint8Array { return new TextEncoder().encode(s); }

// ---------- VAPID key management ----------
type VapidKeys = { publicKey: string; privateJwk: JsonWebKey; subject: string };

let cachedKeys: VapidKeys | null = null;

export async function getVapidKeys(): Promise<VapidKeys> {
  if (cachedKeys) return cachedKeys;
  const { data, error } = await supabaseAdmin
    .from("web_push_config")
    .select("vapid_public_key, vapid_private_key, vapid_subject")
    .eq("id", true)
    .maybeSingle();
  if (!error && data) {
    cachedKeys = {
      publicKey: data.vapid_public_key,
      privateJwk: JSON.parse(data.vapid_private_key) as JsonWebKey,
      subject: data.vapid_subject || VAPID_SUBJECT,
    };
    return cachedKeys;
  }
  // Generate fresh keys
  const kp = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const rawPub = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  const privJwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  const publicKey = b64urlEncode(rawPub);
  const privateJwk = privJwk;
  await supabaseAdmin.from("web_push_config").upsert({
    id: true,
    vapid_public_key: publicKey,
    vapid_private_key: JSON.stringify(privateJwk),
    vapid_subject: VAPID_SUBJECT,
  } as never);
  cachedKeys = { publicKey, privateJwk, subject: VAPID_SUBJECT };
  return cachedKeys;
}

// ---------- VAPID JWT (ES256) ----------
async function signVapidJwt(endpoint: string, keys: VapidKeys): Promise<string> {
  const aud = new URL(endpoint).origin;
  const header = b64urlEncode(utf8(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64urlEncode(utf8(JSON.stringify({
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: keys.subject,
  })));
  const signingInput = `${header}.${payload}`;
  const privKey = await crypto.subtle.importKey(
    "jwk",
    keys.privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privKey, utf8(signingInput));
  return `${signingInput}.${b64urlEncode(sig)}`;
}

// ---------- HKDF helpers (RFC 5869) ----------
async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}
async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  // For length <= 32 we only need one block: T(1) = HMAC(PRK, info || 0x01)
  const t1 = await hmacSha256(prk, concat(info, new Uint8Array([0x01])));
  return t1.slice(0, length);
}

// ---------- aes128gcm encryption (RFC 8291) ----------
async function encryptPayload(
  payload: Uint8Array,
  ua_public_b64: string,
  auth_b64: string,
): Promise<Uint8Array> {
  const ua_public = b64urlDecode(ua_public_b64); // 65 bytes 0x04||x||y
  const auth_secret = b64urlDecode(auth_b64);    // 16 bytes

  // Ephemeral ECDH keypair (application server)
  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const as_public = new Uint8Array(await crypto.subtle.exportKey("raw", ephemeral.publicKey));
  const uaPubKey = await crypto.subtle.importKey(
    "raw",
    ua_public,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const ecdh_secret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaPubKey }, ephemeral.privateKey, 256),
  );

  // PRK_key = HMAC(auth_secret, ecdh_secret); IKM = HKDF-Expand(PRK_key, key_info, 32)
  const prk_key = await hmacSha256(auth_secret, ecdh_secret);
  const key_info = concat(utf8("WebPush: info\0"), ua_public, as_public);
  const ikm = await hkdfExpand(prk_key, key_info, 32);

  // Random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // PRK = HMAC(salt, IKM)
  const prk = await hmacSha256(salt, ikm);
  const cek = await hkdfExpand(prk, utf8("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdfExpand(prk, utf8("Content-Encoding: nonce\0"), 12);

  // Plaintext with single-record padding delimiter 0x02
  const plaintext = concat(payload, new Uint8Array([0x02]));
  const cekKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, plaintext),
  );

  // RFC 8188 header: salt(16) || rs(uint32 BE) || idlen(1) || keyid(idlen)
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  const header = concat(salt, rs, new Uint8Array([as_public.length]), as_public);
  return concat(header, ciphertext);
}

// ---------- send to one subscription ----------
export type PushPayload = { title: string; body: string; url?: string; tag?: string };
export type PushSubRow = { id: string; endpoint: string; p256dh: string; auth: string };

async function sendOne(sub: PushSubRow, payload: PushPayload, keys: VapidKeys): Promise<{ ok: boolean; remove?: boolean }> {
  try {
    const body = await encryptPayload(utf8(JSON.stringify(payload)), sub.p256dh, sub.auth);
    const jwt = await signVapidJwt(sub.endpoint, keys);
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Authorization: `vapid t=${jwt}, k=${keys.publicKey}`,
      },
      body,
    });
    if (res.status === 404 || res.status === 410) return { ok: false, remove: true };
    if (!res.ok) {
      console.error("WebPush send failed", res.status, await res.text().catch(() => ""));
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("WebPush exception", e);
    return { ok: false };
  }
}

// ---------- public API ----------
export async function sendPushToAdmins(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  // Fetch admin user ids
  const { data: admins } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  const adminIds = (admins ?? []).map((r) => r.user_id);
  if (adminIds.length === 0) return { sent: 0, failed: 0 };

  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", adminIds);
  const list = (subs ?? []) as PushSubRow[];
  if (list.length === 0) return { sent: 0, failed: 0 };

  const keys = await getVapidKeys();
  let sent = 0;
  let failed = 0;
  const toRemove: string[] = [];
  await Promise.all(list.map(async (sub) => {
    const r = await sendOne(sub, payload, keys);
    if (r.ok) sent++;
    else {
      failed++;
      if (r.remove) toRemove.push(sub.id);
    }
  }));
  if (toRemove.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("id", toRemove);
  }
  return { sent, failed };
}