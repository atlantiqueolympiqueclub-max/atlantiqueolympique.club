import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collections — see PLAN.md §3.
 *
 * Each collection is a folder of Markdown files you edit by hand. Fields are
 * validated at build time, so a typo fails the build instead of breaking the
 * live site. Images are referenced as paths under `public/images/...` to keep
 * the build simple; move them into `src/` + use the `image()` helper later if
 * you want Astro's on-build optimization.
 */

// "L'ÉQUIPE AOC" — coaches / staff carousel
const team = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    photo: z.string(),
    bio: z.string().optional(),
    order: z.number().default(0),
  }),
});

// "LE CLUB (INSIDE AOC)" — athletes + palmarès
const athletes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/athletes' }),
  schema: z.object({
    name: z.string(),
    photo: z.string(),
    discipline: z.string().optional(),
    palmares: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

// "PROCHAINS ÉVÉNEMENTS"
const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    image: z.string(),
    date: z.coerce.date(),
    // Freeform so it holds a single time or a range, e.g. "09h00" or "14h00 – 19h00".
    time: z.string().optional(),
    location: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    description: z.string().optional(),
    // Past vs. upcoming is derived from `date` at build time — see src/lib/events.ts.
  }),
});

// "BLOG" — articles
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    cover: z.string(),
    excerpt: z.string(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

// "NOTRE GALERIE"
const gallery = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/gallery' }),
  schema: z.object({
    image: z.string(),
    title: z.string().optional(),
    eventName: z.string().optional(),
    date: z.coerce.date().optional(),
    order: z.number().default(0),
  }),
});

// Federation / partner logos (AOC, FSNS, …)
const partners = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/partners' }),
  schema: z.object({
    name: z.string(),
    logo: z.string(),
    url: z.string().url().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { team, athletes, events, blog, gallery, partners };
