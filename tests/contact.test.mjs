import test from 'node:test';
import assert from 'node:assert/strict';
import { handleContact } from '../src/lib/contact.mjs';
const env = { RESEND_API_KEY: 'test-secret', CONTACT_FROM: 'Portfolio <hello@example.com>', CONTACT_TO: 'owner@example.com' };
const request = (overrides = {}, origin = 'https://example.com') => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: 'Visitor', email: 'visitor@example.net', message: '<script>hello</script>', requestId: '01234567-0123-0123-0123-0123456789ab', ...overrides })) data.set(key, value);
  return new Request('https://example.com/api/contact', { method: 'POST', headers: { Origin: origin }, body: data });
};
test('validated contact sends only to the configured owner, with reply-to and an idempotency key', async () => {
  let payload;
  const response = await handleContact(request(), { env, clientAddress: 'valid', send: async (url, options) => {
    payload = JSON.parse(options.body);
    assert.equal(options.headers['Idempotency-Key'], 'contact/01234567-0123-0123-0123-0123456789ab');
    return Response.json({ id: 'receipt' });
  } });
  assert.equal(response.status, 200);
  assert.deepEqual(payload.to, ['owner@example.com']);
  assert.equal(payload.reply_to, 'visitor@example.net');
  assert.equal(payload.html, undefined);
  assert.match(payload.text, /<script>hello<\/script>/);
  assert.ok(!(await response.text()).includes('test-secret'));
});
test('invalid input, bots and cross-origin submissions never call the mail provider', async () => {
  const send = () => { throw new Error('must not send'); };
  for (const overrides of [{ email: 'invalid' }, { message: '' }, { name: 'Header\r\nInjection' }, { website: 'bot' }, { message: 'x'.repeat(5001) }]) assert.equal((await handleContact(request(overrides), { env, send })).status, 400);
  assert.equal((await handleContact(request({}, 'https://attacker.com'), { env, send })).status, 403);
});
test('missing credentials and provider failures are not reported as success', async () => {
  assert.equal((await handleContact(request(), { env: {} })).status, 503);
  for (const send of [async () => new Response('', { status: 500 }), async () => { throw new Error('timeout'); }, async () => Response.json({})]) assert.equal((await handleContact(request(), { env, send, clientAddress: crypto.randomUUID() })).status, 502);
});
test('oversized bodies are rejected even without a Content-Length', async () => {
  const body = new Request('https://example.com/api/contact', { method: 'POST', headers: { Origin: 'https://example.com', 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'message=' + 'x'.repeat(25000) });
  assert.equal((await handleContact(body, { env })).status, 413);
});
test('repeated submissions are throttled per instance', async () => {
  const opts = { env, clientAddress: 'throttled', send: async () => Response.json({ id: 'receipt' }) };
  for (let i = 0; i < 3; i++) assert.equal((await handleContact(request(), opts)).status, 200);
  assert.equal((await handleContact(request(), opts)).status, 429);
});
