import type { APIRoute } from 'astro';
import { handleContact } from '../../lib/contact.mjs';
export const prerender = false;
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const result = await handleContact(request, { clientAddress });
  if (request.headers.get('accept')?.includes('application/json')) return result;
  const ok = result.ok;
  // Progressive enhancement: no JavaScript still gets an honest result and a way back.
  const text = ok ? 'Thanks — your message was sent. / メッセージを送信しました。' : 'Your message was not sent. Please go back to try again or contact me on LinkedIn. / 送信できませんでした。戻って再送するか、LinkedInからご連絡ください。';
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Message — Takao Umehara</title><body><main><h1>${text}</h1><p><a href="/about#work-with-me">Back to About / Aboutへ戻る</a></p><p><a href="https://linkedin.com/in/takaoumehara/">LinkedIn</a></p></main></body></html>`, { status: result.status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
};
