# Setup guide — CMS + hosting (one-time)

This sets up the **Sveltia CMS** editing panel and free hosting on **Cloudflare
Pages**. You do this **once**. After that, your non-technical editor just goes to
`/admin`, logs in, and edits — see [`GUIDE-EDITEUR.md`](./GUIDE-EDITEUR.md).

## How it fits together

```
   Editor  ──login──►  /admin  (Sveltia CMS, a static page on your site)
                          │
                          ▼
             Auth worker (Cloudflare) ──► GitHub OAuth  ("Login with GitHub")
                          │
              Save = a commit to your GitHub repo
                          │
                          ▼
        Cloudflare Pages rebuilds the site ──► live in ~1–2 min
```

No database, no server to maintain, nothing to patch. The only moving parts are
your GitHub repo, Cloudflare Pages (hosting), and a tiny auth worker.

## Cost

**€0.** Everything below fits in the free tiers of GitHub and Cloudflare.

## What you need

- An email address.
- ~20 minutes.
- This project on your computer (you already have it).

---

## Step 1 — Create a GitHub account and push the code

GitHub is where your website's files and content live.

1. Create a free account at <https://github.com/signup>.
2. Create a new **empty** repository at <https://github.com/new>:
   - **Repository name:** e.g. `aoc-website`
   - Visibility: **Private** is fine (recommended).
   - **Do not** add a README, .gitignore, or license (the project already has them).
3. Push this project. In a terminal, from the project folder:

   ```bash
   git add -A
   git commit -m "Add Sveltia CMS + hosting config"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/aoc-website.git
   git push -u origin main
   ```

   > Tip: if you prefer a graphical tool, [GitHub Desktop](https://desktop.github.com)
   > does the same thing with buttons.

> 💬 If you'd like, I (Claude) can run the `git` commands for you once your GitHub
> account and empty repo exist — just say so and paste the repo URL.

---

## Step 2 — Point the CMS at your repo

Open **`public/admin/config.yml`** and edit the `backend` block:

```yaml
backend:
  name: github
  repo: YOUR-USERNAME/aoc-website     # ← your account + repo name
  branch: main
  base_url: https://WORKER.workers.dev  # ← filled in at Step 5
```

Leave `base_url` for now; you'll set it in Step 5.

---

## Step 3 — Host the site on Cloudflare Pages

1. Create a free account at <https://dash.cloudflare.com/sign-up>.
2. In the dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
3. Authorize Cloudflare to access GitHub, then pick your `aoc-website` repo.
4. Build settings:
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**. After ~1 minute you get a live URL like
   `https://aoc-website.pages.dev`. **Write it down** — this is your site.

From now on, every push to `main` (including every CMS save) auto-rebuilds the site.

---

## Step 4 — Deploy the login helper (auth worker)

The editor's "Login with GitHub" button needs a tiny helper. It's free and
maintained by Sveltia.

1. Go to <https://github.com/sveltia/sveltia-cms-auth>.
2. Click the **"Deploy to Cloudflare Workers"** button in its README and follow
   the prompts (it deploys into your Cloudflare account).
3. When done, note the worker URL, e.g. `https://sveltia-cms-auth.YOURNAME.workers.dev`.

---

## Step 5 — Connect GitHub login

**5a. Create a GitHub OAuth App** at
<https://github.com/settings/developers> → **OAuth Apps → New OAuth App**:

- **Application name:** `AOC site editor`
- **Homepage URL:** your Pages URL (e.g. `https://aoc-website.pages.dev`)
- **Authorization callback URL:** your **worker URL + `/callback`**
  (e.g. `https://sveltia-cms-auth.YOURNAME.workers.dev/callback`)

Click **Register application**, then **Generate a new client secret**. Keep the
**Client ID** and **Client secret** handy (the secret is shown once).

**5b. Give the worker those credentials.** In Cloudflare:
**Workers & Pages → your `sveltia-cms-auth` worker → Settings → Variables**, add:

| Variable | Value | Notes |
|---|---|---|
| `GITHUB_CLIENT_ID` | *(the Client ID)* | |
| `GITHUB_CLIENT_SECRET` | *(the Client secret)* | click **Encrypt** |
| `ALLOWED_DOMAINS` | `*.pages.dev` *(and your custom domain later)* | restricts who can use this login |

Save (the worker redeploys automatically).

**5c. Finish the config.** Back in **`public/admin/config.yml`**, set:

```yaml
  base_url: https://sveltia-cms-auth.YOURNAME.workers.dev
```

Commit and push:

```bash
git add public/admin/config.yml
git commit -m "Wire up CMS auth"
git push
```

---

## Step 6 — Give your editor access

Your editor logs in **with their own free GitHub account**:

1. Ask them to create one at <https://github.com/signup> (2 minutes).
2. In your repo: **Settings → Collaborators → Add people** → their username.
   Give them **Write** access. They accept the emailed invite.

That's all they ever need. Send them [`GUIDE-EDITEUR.md`](./GUIDE-EDITEUR.md).

---

## Step 7 — Test it

1. Go to `https://YOUR-SITE.pages.dev/admin`.
2. Click **Login with GitHub**, authorize.
3. You should see the editor. Make a tiny change (e.g. a phone number), **Publish**,
   wait ~2 minutes, and confirm it shows on the live site.

If login fails, re-check: the callback URL matches the worker URL + `/callback`,
`base_url` matches the worker URL, and `repo` is correct.

---

## Optional — your own domain

1. In Cloudflare Pages → your project → **Custom domains → Set up a domain**
   (e.g. `aoc.sn`). Cloudflare walks you through DNS.
2. Add that domain to the worker's `ALLOWED_DOMAINS` (Step 5b).
3. Update **`astro.config.mjs`** → `site:` to your real URL, and commit
   (used for SEO/sitemap/canonical links).

---

## Security & maintenance notes

- **No server to hack.** The site is static files; the "CMS" is a static page.
  Logins are handled by GitHub itself. There is no database, no PHP, no plugins —
  the usual sources of CMS breaches don't exist here.
- **Every change is versioned** in Git. Nothing is ever truly lost; any edit can
  be rolled back from the repo's history.
- **Access control** = repo collaborators. To remove someone's access, remove
  them from the repo (Settings → Collaborators). Their login stops working.
- **`ALLOWED_DOMAINS`** on the worker ensures only *your* site can use the login.
- **Updates:** the CMS loads the latest stable Sveltia from a CDN, so security
  fixes arrive automatically — nothing to update by hand. (If you ever want to
  freeze a version, pin it in `public/admin/index.html`.)
- **Security headers** (CSP, HSTS, etc.) are served via `public/_headers`.

---

## Files added for the CMS (reference)

| File | Purpose |
|---|---|
| `public/admin/index.html` | The editor page (loads Sveltia CMS) |
| `public/admin/config.yml` | Defines every editing form (French labels) |
| `public/images/uploads/` | Where uploaded photos are stored |
| `public/_headers` | Security headers for Cloudflare Pages |
| `GUIDE-EDITEUR.md` | The day-to-day guide for your editor (French) |
| `SETUP.md` | This file |
