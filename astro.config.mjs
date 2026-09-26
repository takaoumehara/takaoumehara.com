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
//
// /admin and /api/admin/* are on-demand too; Clerk guards them from
// src/middleware.ts (docs/admin.md). The @clerk/astro *integration* is left
// out on purpose: it injects Clerk's loader into every page of the site and
// asks for `output: "server"`. Its middleware and client runtime are used
// directly instead, scoped to /admin, so the public pages stay static and
// carry no Clerk script — and a build without Clerk keys works unchanged.
import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import vercel from "@astrojs/vercel";

/**
 * `virtual:admin-media` — every image the site ships under public/assets/ as
 * site-relative paths ("assets/<dir>/…"), listed when the bundle is built.
 * The admin's media picker and the save endpoint's "does this path exist"
 * check read it; the on-demand functions do not carry public/ themselves.
 * Uploaded masters (public/assets/<slug>/masters, not deployed) are left out.
 */
function adminMediaManifest() {
  const id = "virtual:admin-media";
  const resolved = "\0" + id;
  const publicDir = fileURLToPath(new URL("./public/", import.meta.url));
  const assetsDir = join(publicDir, "assets");
  const IMAGE = /\.(?:jpe?g|png|webp|avif|gif|svg)$/i;
  const scan = () => {
    const out = [];
    const walk = (dir) => {
      let entries = [];
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        if (e.name.startsWith(".")) continue;
        const full = join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== "masters") walk(full); }
        else if (IMAGE.test(e.name)) out.push(relative(publicDir, full).split(sep).join("/"));
      }
    };
    walk(assetsDir);
    return out.sort();
  };
  return {
    name: "admin-media-manifest",
    resolveId: (source) => (source === id ? resolved : undefined),
    load: (moduleId) => (moduleId === resolved ? `export default ${JSON.stringify(scan())};` : undefined),
    configureServer(server) {
      const refresh = (file) => {
        if (!file.startsWith(assetsDir)) return;
        const graphs = [server.moduleGraph, ...Object.values(server.environments ?? {}).map((env) => env.moduleGraph)];
        for (const graph of graphs) {
          const mod = graph?.getModuleById?.(resolved);
          if (mod) graph.invalidateModule(mod);
        }
      };
      server.watcher.on("add", refresh);
      server.watcher.on("unlink", refresh);
    },
  };
}

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
  vite: { plugins: [adminMediaManifest()] },
});
