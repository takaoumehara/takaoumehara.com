// Session and HTTP helpers for the Studio's API functions. Zero dependencies:
// Web Crypto for the sealed cookie, the Fetch API for requests and responses.
//
// The session cookie carries the owner's GitHub OAuth token, AES-GCM sealed
// with SESSION_SECRET, HttpOnly, Secure, SameSite=Lax, eight hours. Nothing is
// stored on the server; publishing commits under the owner's own identity.
const enc = new TextEncoder();
const dec = new TextDecoder();

export const SESSION_COOKIE = "studio";
export const STATE_COOKIE = "studio_state";
export const SESSION_MAX_AGE = 8 * 60 * 60;

export function env(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value == null || value === "") {
    const error = new Error(`Missing environment variable ${name}. Set it in the Vercel project (see docs/adaptive-portfolio-architecture.md §16.7).`);
    error.status = 500;
    throw error;
  }
  return value;
}

const b64u = (bytes) => Buffer.from(bytes).toString("base64url");
const unb64u = (text) => new Uint8Array(Buffer.from(text, "base64url"));

async function aesKey(secret) {
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function seal(payload, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await aesKey(secret);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(payload))));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv); out.set(ct, iv.length);
  return b64u(out);
}

export async function unseal(token, secret) {
  try {
    const bytes = unb64u(token);
    const key = await aesKey(secret);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12));
    return JSON.parse(dec.decode(plain));
  } catch {
    return null;
  }
}

export function parseCookies(request) {
  const out = {};
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookie(name, value, { maxAge = SESSION_MAX_AGE, clear = false, secure = true } = {}) {
  const attrs = [`${name}=${clear ? "" : encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${clear ? 0 : maxAge}`];
  if (secure) attrs.push("Secure");
  return attrs.join("; ");
}

export const json = (data, init = {}) => new Response(JSON.stringify(data), { ...init, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...(init.headers ?? {}) } });
export const redirect = (location, headers = {}) => new Response(null, { status: 302, headers: { location, ...headers } });

/** The signed-in owner, or null. A session for anyone but OWNER_LOGIN is never issued, but check again anyway. */
export async function currentUser(request, { sessionSecret = env("SESSION_SECRET"), ownerLogin = env("OWNER_LOGIN") } = {}) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const session = await unseal(token, sessionSecret);
  if (!session?.login || !session?.token) return null;
  if (session.login.toLowerCase() !== ownerLogin.toLowerCase()) return null;
  if (session.exp && Date.now() > session.exp) return null;
  return session;
}

/** Turn a thrown error into a JSON response the Studio can show. */
export function errorResponse(error) {
  const status = error.status ?? 500;
  return json({ error: error.message, reason: error.reason ?? (status === 401 ? "unauthorized" : status === 403 ? "forbidden" : "error"), ...(error.details ? { details: error.details } : {}) }, { status });
}

export const isSecure = (request) => { try { return new URL(request.url).protocol === "https:"; } catch { return true; } };
export const origin = (request) => process.env.SITE_URL ?? new URL(request.url).origin;
