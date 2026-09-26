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
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
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
  const done = adapter.hooks["astro:build:done"];
  adapter.hooks["astro:build:done"] = async (context) => {
    await done(context);
    addCleanUrlsAndRedirects(fileURLToPath(new URL("./", import.meta.url)), fileURLToPath(context.dir));
  };
  return adapter;
}

/**
 * The adapter's routing (.vercel/output/config.json) serves files only by
 * their exact name, so the site's own extensionless links (/work, /about,
 * /projects/<slug>) fell through to the 404 route in production, and the
 * redirects in vercel.json are not merged into Build Output API routes.
 * After the adapter writes its config: vercel.json redirects go in front of
 * the filesystem, and every built page `x.html` is also served at `/x`.
 */
function addCleanUrlsAndRedirects(root, builtDir) {
  const outDir = join(root, ".vercel/output");
  const configPath = join(outDir, "config.json");
  // The adapter copies the pages into .vercel/output/static only after this
  // hook, so the page list comes from the build directory itself.
  const staticDir = builtDir;
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let redirects = [];
  try {
    redirects = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")).redirects ?? [];
  } catch { /* no vercel.json */ }
  const redirectRoutes = redirects.map((r) => ({
    src: `^${escape(r.source)}$`,
    headers: { Location: r.destination },
    status: r.permanent === false ? 307 : 308,
  }));

  const pages = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== "_astro" && e.name !== "assets") walk(full); }
      else if (e.name.endsWith(".html") && e.name !== "index.html" && e.name !== "404.html") {
        pages.push(relative(staticDir, full).split(sep).join("/").slice(0, -".html".length));
      }
    }
  };
  walk(staticDir);
  const cleanRoutes = pages.sort().map((p) => ({ src: `^/${escape(p)}/?$`, dest: `/${p}.html` }));

  const fs = config.routes.findIndex((r) => r.handle === "filesystem");
  config.routes.splice(fs + 1, 0, ...cleanRoutes);
  config.routes.splice(fs, 0, ...redirectRoutes);
  writeFileSync(configPath, JSON.stringify(config, null, "\t"));
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
