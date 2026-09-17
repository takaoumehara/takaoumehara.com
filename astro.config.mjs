// takaoumehara.com — Astro configuration.
//
// Static output, deployed on Vercel. Only two kinds of route render on demand
// (`export const prerender = false`): /lens/preview, which the Studio and /try
// use to render a lens draft with the same components as the built pages, and
// /api/*, the Studio's GitHub sign-in and publish functions.
//
// `build.format: 'file'` keeps every URL the site has always had:
// src/pages/about.astro → /about.html, src/pages/projects/[slug].astro →
// /projects/<slug>.html, src/pages/lens/[slug]/index.astro → /lens/<slug>/.
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://takaoumehara.com",
  output: "static",
  adapter: vercel(),
  integrations: [mdx()],
  build: { format: "preserve" },
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
});
