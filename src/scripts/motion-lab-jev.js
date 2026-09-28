// The Motion Lab's "Ask Jev" row: sends the current config (and, if typed,
// the sentence it should deliver) to /api/admin/jev/motion and prints the
// readings in the panel's status line. The key never reaches the browser;
// the route answers only the signed-in owner (docs/jev.md), so anyone else
// sees "sign in at /admin" and the rest of the Lab is unaffected.
export const JEV_ENDPOINT = "/api/admin/jev/motion";

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

/**
 * The panel row. `el` is the Lab's element helper, `getConfig` the current
 * config, `say` the status setter. Returns the element to append.
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
  input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); button.click(); } });
  return el("div", { class: "mlab-f mlab-f-jev" },
    el("div", { class: "mlab-lab" }, el("label", { for: "mlab-jev-ask", text: "Judge with Jev" })),
    el("div", { class: "mlab-ctl" }, input, button));
}
