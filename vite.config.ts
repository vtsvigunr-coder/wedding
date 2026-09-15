import { defineConfig } from 'vite';

/**
 * The invitation is not served from a domain of its own. It lives under
 * `invitated.com/hira-azain`, which proxies this deployment and strips that
 * prefix on the way through — so the files sit at the root here, while every
 * address the page prints has to carry the prefix the visitor's browser will
 * ask for.
 *
 * That is exactly what `base` does: Vite rewrites the asset addresses in the
 * markup and the stylesheets, and `import.meta.env.BASE_URL` carries the same
 * prefix into the one address the page builds in script (see `letterFrameSrc`).
 * Change it here and both follow.
 */
export default defineConfig({
  base: '/hira-azain/',
});
