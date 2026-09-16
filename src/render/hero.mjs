import { esc, t, tb, href } from "./html.mjs";

export function hero({ lens, lib, ctx }) {
  const tagline = lens.identity?.tagline ?? lib.profile.tagline;
  const eyebrow = lens.hero.eyebrow ? `<p class="hero-eyebrow">${t(lens.hero.eyebrow)}</p>` : "";
  const note = lens.hero.note ? `<p class="hero-note">${tb(lens.hero.note)}</p>` : "";
  const primary = lens.hero.cta?.primary ?? lens.cta.primary;
  const secondaryCta = lens.hero.cta?.secondary ?? lens.cta.secondary;
  const secondary = secondaryCta
    ? `<a href="${esc(href(ctx, secondaryCta.href))}" class="hero-alt">${t(secondaryCta.label)}</a>`
    : "";
  const idLine = lens.hero.eyebrow
    ? `<p class="hero-id"><b>${esc(lib.profile.name)}</b> <span class="hero-id-sep">·</span> ${t(lib.profile.location)}</p>`
    : `<p class="hero-id"><b>${esc(lib.profile.name)}</b> <span class="hero-id-sep">·</span> ${t(tagline)} <span class="hero-id-sep">·</span> ${t(lib.profile.location)}</p>`;
  return `  <section class="hero" id="top">
    ${idLine}
    ${eyebrow}
    <h1 class="hero-line">${t(lens.hero.title)}</h1>
    <p class="hero-sub">${tb(lens.hero.body)}</p>
    ${note}
    <div class="hero-cta">
      <a href="${esc(href(ctx, primary.href))}" class="btn-primary">${t(primary.label)}</a>
      ${secondary}
    </div>
  </section>`;
}
