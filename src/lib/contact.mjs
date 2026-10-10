// The recipient and API credentials stay on the server. Plain-text email only.
const attempts = new Map();
const json = (status, ok) => new Response(JSON.stringify({ ok }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export async function handleContact(request, { env = process.env, send = fetch, clientAddress = 'unknown', now = Date.now() } = {}) {
  if (request.method !== 'POST') return json(405, false);
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return json(403, false);
  if (!request.headers.get('content-type')?.match(/^(multipart\/form-data|application\/x-www-form-urlencoded)/i)) return json(415, false);
  // Stream with a hard limit, even when Content-Length is absent or dishonest.
  const reader = request.body?.getReader();
  if (!reader) return json(400, false);
  const chunks = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 24000) { await reader.cancel(); return json(413, false); }
    chunks.push(value);
  }
  let data;
  try { data = await new Response(new Blob(chunks), { headers: { 'Content-Type': request.headers.get('content-type') } }).formData(); }
  catch { return json(400, false); }
  const value = key => typeof data.get(key) === 'string' ? data.get(key).trim() : '';
  if (value('website')) return json(400, false);
  const name = value('name'), email = value('email'), message = value('message'), requestId = value('requestId');
  if (!name || name.length > 100 || /[\r\n]/.test(name) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message || message.length > 5000 || (requestId && !/^[\da-f-]{36}$/i.test(requestId))) return json(400, false);
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM || !env.CONTACT_TO) return json(503, false);
  // Best-effort per-instance throttle. Production must also enforce a Vercel WAF rate limit.
  for (const [ip, entry] of attempts) if (now - entry.start >= 60000) attempts.delete(ip);
  const entry = attempts.get(clientAddress) ?? { start: now, count: 0 };
  if (entry.count >= 3) return json(429, false);
  entry.count++; attempts.set(clientAddress, entry);
  try {
    const response = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', ...(requestId ? { 'Idempotency-Key': `contact/${requestId}` } : {}) },
      body: JSON.stringify({ from: env.CONTACT_FROM, to: [env.CONTACT_TO], reply_to: email, subject: `Portfolio message from ${name}`, text: `From: ${name}\nReply to: ${email}\n\n${message}` }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return json(response.status === 429 ? 429 : 502, false);
    const receipt = await response.json();
    return receipt.id ? json(200, true) : json(502, false);
  } catch { return json(502, false); }
}
