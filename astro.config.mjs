// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  // Public site URL — used for canonical links, sitemaps, RSS, etc.
  // Change this to the real domain before launch (see PLAN.md §10.4).
  site: 'https://aoc.example.sn',

  // Zero JS by default. Islands opt-in per component (carousel, gallery, map).
  vite: {
    // Cast avoids a cosmetic type clash between Astro's bundled Vite and the
    // one @tailwindcss/vite is typed against (runtime is unaffected).
    plugins: [/** @type {any} */ (tailwindcss())],
  },

  adapter: cloudflare()
});