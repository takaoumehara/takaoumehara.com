// Types for the admin routes (the leading underscore keeps this out of the routes).

/** Every image under public/assets/, site-relative, listed at build time (astro.config.mjs). */
declare module "virtual:admin-media" {
  const files: string[];
  export default files;
}

declare namespace App {
  interface Locals {
    /** Set by src/middleware.ts on /admin and /api/admin/* only. */
    admin?: import("../api/admin/_auth").AdminState;
    /** Set by Clerk's middleware when it runs (admin routes with keys configured). */
    auth?: (options?: any) => any;
    currentUser?: () => Promise<any>;
  }
}
