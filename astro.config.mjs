// takaoumehara.com — Astro configuration.
//
// Static output, deployed on Vercel. Only two kinds of route render on demand
// (`export const prerender = false`): /lens/preview, which the Studio and /try
// use to render a lens draft with the same components as the built pages, and
// /api/*, the Studio's GitHub sign-in and publish functions.
//
// URLs stay what the site has always served. `build.format: 'preserve'` writes
// src/pages/about.astro → /about.html, src/pages/projects/[slug].astro →
// /projects/<slug>.html, and src/pages/lens/[slug]/index.astro →
// /lens/<slug>/index.html. The Vercel adapter forces `format: 'directory'`
// in its own config hook (which would turn about.html into about/index.html),
// so the adapter is wrapped and the format is set back after its hook has run.
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import vercel from "@astrojs/vercel";

function vercelKeepingUrls() {
  const adapter = vercel();
  const setup = adapter.hooks["astro:config:setup"];
  adapter.hooks["astro:config:setup"] = async (context) => {
    await setup(context);
    context.updateConfig({ build: { format: "preserve" } });
  };
  return adapter;
}

export default defineConfig({
  site: "https://takaoumehara.com",
  output: "static",
  adapter: vercelKeepingUrls(),
  integrations: [mdx()],
  build: { format: "preserve" },
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
});
