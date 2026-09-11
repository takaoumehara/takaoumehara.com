import { esc, t, tb, href } from "./html.mjs";

export function hero({ lens, lib, ctx }) {
  const tagline = lens.identity?.tagline ?? lib.profile.tagline;
  const eyebrow = lens.hero.eyebrow ? `<p class="hero-eyebrow">${t(lens.hero.eyebrow)}</p>` : "";
  const note = lens.hero.note ? `<p class="hero-note">${tb(lens.hero.note)}</p>` : "";
  const secondary = lens.cta.secondary
    ? `<a href="${esc(href(ctx, lens.cta.secondary.href))}" class="hero-alt">${t(lens.cta.secondary.label)}</a>`
    : "";
  return `  <section class="hero" id="top">
    <p class="hero-id">
      <b>${esc(lib.profile.name)}</b>
      <span class="hero-id-sep">·</span> ${t(tagline)}
      <span class="hero-id-sep">·</span> ${t(lib.profile.location)}
    </p>
    ${eyebrow}
    <h1 class="hero-line">${t(lens.hero.title)}</h1>
    <p class="hero-sub">${tb(lens.hero.body)}</p>
    ${note}
    <div class="hero-cta">
      <a href="${esc(href(ctx, lens.cta.primary.href))}" class="btn-primary">${t(lens.cta.primary.label)}</a>
      ${secondary}
    </div>
  </section>`;
}
