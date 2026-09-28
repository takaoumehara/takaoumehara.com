// GET /api/lab/peek?url= → { title, description, image, site } of a public
// page, for the Motion Lab's "A URL" stage (/lab/motion). Public (the
// middleware guards /api/admin/* only), so it refuses anything but a public
// http(s) host — checked again on every redirect hop, which is why redirects
// are followed by hand — waits 5 s at most and reads 300 KB at most.
// The parsing is in src/server/peek.mjs (tested in tests/lab-tool.test.mjs).
import type { APIRoute } from "astro";
import { checkUrl, decodeBody, isHtml, parsePeek, MAX_BYTES, MAX_REDIRECTS, TIMEOUT_MS } from "../../../server/peek.mjs";

export const prerender = false;

const json = (body: unknown, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache } });

async function readCapped(res: Response): Promise<Uint8Array> {
  const out = new Uint8Array(MAX_BYTES);
  let n = 0;
  const reader = res.body?.getReader();
  if (!reader) return out.subarray(0, 0);
  while (n < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    const take = Math.min(value.length, MAX_BYTES - n);
    out.set(value.subarray(0, take), n);
    n += take;
  }
  reader.cancel().catch(() => {});
  return out.subarray(0, n);
}

export const GET: APIRoute = async ({ url }) => {
  const first = checkUrl(url.searchParams.get("url"));
  if (!first.ok) return json({ error: first.error, message: "Pass a public http(s) URL." }, 400);
  let target: URL = first.url;
  let res!: Response;
  try {
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    for (let hop = 0; ; hop++) {
      res = await fetch(target, { redirect: "manual", signal, headers: { accept: "text/html,application/xhtml+xml", "user-agent": "takaoumehara.com Motion Lab peek" } });
      const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (!location) break;
      if (hop >= MAX_REDIRECTS) return json({ error: "too-many-redirects" }, 502);
      const next = checkUrl(new URL(location, target).href);
      if (!next.ok) return json({ error: next.error, message: "The page redirects somewhere this tool may not read." }, 400);
      target = next.url;
    }
    if (!res.ok) return json({ error: "upstream", status: res.status, message: `The page answered ${res.status}.` }, 502);
    if (!isHtml(res.headers.get("content-type"))) return json({ error: "not-html", message: "That URL is not an HTML page." }, 415);
    const bytes = await readCapped(res);
    return json(parsePeek(decodeBody(bytes, res.headers.get("content-type") ?? ""), target.href), 200, "public, max-age=300");
  } catch {
    return json({ error: "fetch-failed", message: "The page could not be read (offline, blocked or too slow)." }, 502);
  }
};

export const ALL: APIRoute = () => json({ error: "method-not-allowed" }, 405);
