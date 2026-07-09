# Atlantique Olympique Club — website

Static website for the **Atlantique Olympique Club (AOC)**, a swimming club in
Dakar. Built with **Astro + Tailwind CSS**, it ships only a few KB of vanilla
JS (carousel arrows, the map, and the « La Plongée » caustic-light effect — all
progressive enhancements) and has no database, CMS or backend: content lives as
Markdown/JSON in this repo and the whole site is plain static files.

## Quick start

```bash
npm install            # install dependencies
npm run dev            # dev server → http://localhost:4321
```

Build the static site:

```bash
npm run build          # → dist/
npm run preview        # serve the production build locally
```

## Project structure

```
src/
├── components/   Header, Hero, PageHero, SectionHeader, StatsBand, TeamCarousel,
│                 AthleteGrid, EventList, BlogCard, FeaturedNews, GalleryGrid,
│                 ContactBar, MapEmbed, WaveDivider, SwimDivider, DeepWater, …
├── content/      team/ athletes/ events/ blog/ gallery/ partners/  (Markdown)
├── content.config.ts   collection schemas (validated at build time)
├── data/         site.json · contact.json · home.md  (singletons)
├── layouts/      BaseLayout.astro
├── pages/        index · evenements · galerie · blog/[…]
└── styles/       global.css  (Tailwind v4 + AOC design tokens)
public/images/    generated SVG placeholders (swap for real photos)
public/js/        tiny vanilla enhancements (carousel arrows, deep-fx.js — the
                  « La Plongée » caustic-light effect in the hero/banners)
Caddyfile         optional hardened web server + HTTPS (for self-hosting)
```

## Editing content

### Option A — Visual editor (Sveltia CMS) · recommended for non-technical editors

The site ships with a **git-based CMS**. Editors go to **`/admin`**, log in with
GitHub, and edit everything through simple forms — text, images, athletes, staff,
events, blog, gallery, contact. Each save is a Git commit; Cloudflare Pages
republishes automatically in ~1–2 min. No database, no backend to maintain.

- **One-time setup** (GitHub + free Cloudflare hosting + login) → [`SETUP.md`](./SETUP.md)
- **Day-to-day editing guide** (French, for the editor) → [`GUIDE-EDITEUR.md`](./GUIDE-EDITEUR.md)

### Option B — Edit the files by hand

Every section is also plain Markdown/JSON you can edit directly. Examples:

- **Add an event** → drop a `.md` file in `src/content/events/` and commit.
- **Add a blog post** → `src/content/blog/<slug>.md` (Markdown body + frontmatter).
- **Team / athletes / gallery / partners** → matching folders under `src/content/`.
- **Phone / email / address / map** → `src/data/contact.json`.
- **Nav & social links** → `src/data/site.json`.
- **"Le club en chiffres" numbers** → `src/data/site.json` → `stats` (the
  homepage counters animate to these values on scroll).
- **Hero & "Qui sommes-nous" copy** → `src/data/home.md`.
- **Logo & favicon** → `public/logo.png` (header/footer) and `public/favicon.ico`
  / `public/apple-touch-icon.png`.

Fields are validated against `src/content.config.ts` at build time, so a typo
fails the build instead of breaking the live site.

### Images

Placeholders in `public/images/` are generated SVGs. To use real photos, drop
them in `public/images/...` and point the matching content field at them (e.g.
`cover: "/images/blog/my-photo.jpg"`). To enable Astro's build-time image
optimization later, move images into `src/` and switch the schemas to the
`image()` helper.

## Deploy

The build output in `dist/` is plain static files — host it anywhere (GitHub
Pages, Cloudflare Pages, Netlify, or your own server). For self-hosting, a
hardened **Caddy** config (auto-HTTPS + security headers) is included in
`Caddyfile`:

```bash
make deploy SERVER=deploy@aoc.sn REMOTE_DIR=/var/www/aoc/dist
```

## Before launch

- [ ] Gallery "likes" → currently **decorative** (real likes need a backend).
- [ ] Real club numbers in `src/data/site.json` → `stats` (placeholders today).
- [ ] Real contact details in `src/data/contact.json`.
- [ ] Real domain in `astro.config.mjs` (`site`) and `Caddyfile`.
- [ ] Replace placeholder content & images with the real thing.
```
