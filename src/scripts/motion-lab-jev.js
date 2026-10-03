// The Motion Lab's "Ask Jev" row: sends the current config (and, if typed,
// the sentence it should deliver) to /api/admin/jev/motion and prints the
// readings in the panel's status line. The key never reaches the browser;
// the route answers only the signed-in owner (docs/jev.md), so anyone else
// sees "sign in at /admin" and the rest of the Lab is unaffected.
//
// "Suggest 3" sends the sentence and the current config to
// /api/admin/jev/suggest: the server makes three candidate configs by rules
// and Jev sorts them (unsorted without its key). Each card can be tried
// (imported into the panel) or copied as JSON.
export const JEV_ENDPOINT = "/api/admin/jev/motion";
export const SUGGEST_ENDPOINT = "/api/admin/jev/suggest";

// The row's styles. A dynamic import so Node (tests/jev.test.mjs) can import
// this module; in the browser the bundler loads the CSS with the lab chunk.
if (typeof document !== "undefined") import("../styles/motion-lab-jev.css").catch(() => {});

/** Turn the route's JSON into the one line the status row shows. */
export function describeJevResult(status, body) {
  if (status === 200 && body?.ok) return `Jev (${body.model}): ${body.readings.join(" · ")}`;
  if (status === 401) return "Jev: sign in at /admin first (owner only), then ask again.";
  if (status === 403) return "Jev: this account may not ask (owner only).";
  if (status === 503) return `Jev is not configured: ${body?.message ?? "the server has no key for it (see docs/jev.md)."}`;
  if (status === 502) return `Jev: ${body?.message ?? "no answer."}`;
  return `Jev: ${body?.message ?? `unexpected ${status}.`}`;
}

/** POST the config; resolves to the status line, never throws. */
export async function askJev(config, request, { fetchImpl = globalThis.fetch } = {}) {
  try {
    const res = await fetchImpl(JEV_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request ? { config, request } : { config }),
    });
    let body = null;
    try { body = await res.json(); } catch {}
    return describeJevResult(res.status, body);
  } catch (err) {
    return `Jev could not be reached: ${err.message}`;
  }
}

/** Turn the suggest route's JSON into the one line the status row shows. */
export function describeSuggest(status, body) {
  const n = Array.isArray(body?.candidates) ? body.candidates.length : 0;
  if (status === 200 && body?.ok) {
    if (body.judged) return `Jev sorted ${n} suggestions: best match first.`;
    const why = /not configured/i.test(body.error ?? "") ? "Jev not configured" : (body.error || "Jev did not answer");
    return `${n} suggestions (${why}: unsorted).`;
  }
  if (status === 503) return n ? `${n} suggestions (Jev not configured: unsorted).` : describeJevResult(503, body);
  return describeJevResult(status, body);
}

/** POST the sentence and the config; resolves to { status, body }, never throws. */
export async function askSuggest(config, request, { fetchImpl = globalThis.fetch } = {}) {
  try {
    const res = await fetchImpl(SUGGEST_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ request, config }),
    });
    let body = null;
    try { body = await res.json(); } catch {}
    return { status: res.status, body };
  } catch (err) {
    return { status: 0, body: { message: `could not be reached: ${err.message}` } };
  }
}

/** One card per candidate: name, why, Jev's reading when judged, Try and Copy JSON. */
function suggestCards({ el, say, apply }, list, body) {
  list.replaceChildren(...body.candidates.map((c, i) => {
    const tryIt = el("button", { type: "button", class: "mlab-btn mlab-primary" }, "Try");
    tryIt.addEventListener("click", () => apply(c.config));
    const copy = el("button", { type: "button", class: "mlab-btn" }, "Copy JSON");
    copy.addEventListener("click", async () => {
      const text = JSON.stringify(c.config, null, 2);
      try { await navigator.clipboard.writeText(text); say(`Copied “${c.name}” (${text.length.toLocaleString()} characters of JSON).`); }
      catch (err) { say("Clipboard unavailable: press Try, then the panel's Copy JSON."); }
    });
    return el("li", { class: "mlab-sg-card" },
      el("p", { class: "mlab-sg-name" }, el("span", { class: "mlab-sg-n", text: `${i + 1}` }), c.name),
      el("p", { class: "mlab-sg-why", text: c.why }),
      body.judged && c.readings?.length ? el("p", { class: "mlab-sg-read", text: c.readings.join(" · ") }) : null,
      el("div", { class: "mlab-actions" }, tryIt, copy));
  }));
  list.hidden = false;
}

/**
 * The panel row. `el` is the Lab's element helper, `getConfig` the current
 * config, `say` the status setter, `apply` imports a config into the panel.
 * Returns the element to append.
 */
export function jevRow({ el, getConfig, say, apply }) {
  const input = el("input", { type: "text", id: "mlab-jev-ask", class: "mlab-text", placeholder: "What should it feel like? (optional)", maxlength: "600", autocomplete: "off" });
  const button = el("button", { type: "button", class: "mlab-btn" }, "Ask Jev");
  button.addEventListener("click", async () => {
    button.disabled = true;
    say("Asking Jev…");
    say(await askJev(getConfig(), input.value.trim()));
    button.disabled = false;
  });
  const list = el("ol", { class: "mlab-sg", hidden: true, "aria-label": "Suggestions" });
  const suggestBtn = el("button", { type: "button", class: "mlab-btn", title: "Three candidate configs for the sentence, sorted by Jev" }, "Suggest 3");
  suggestBtn.addEventListener("click", async () => {
    suggestBtn.disabled = true;
    say("Suggesting…");
    const { status, body } = await askSuggest(getConfig(), input.value.trim());
    if (Array.isArray(body?.candidates) && body.candidates.length) suggestCards({ el, say, apply }, list, body);
    else { list.replaceChildren(); list.hidden = true; }
    say(describeSuggest(status, body));
    suggestBtn.disabled = false;
  });
  input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); button.click(); } });
  return el("div", { class: "mlab-f mlab-f-jev" },
    el("div", { class: "mlab-lab" }, el("label", { for: "mlab-jev-ask", text: "Judge with Jev" })),
    el("div", { class: "mlab-ctl" }, input, button, suggestBtn),
    list);
}
