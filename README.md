# Spartans Soccer Academy — Club Website

A fast, accessible club website with a built-in content management system.

Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript** and **Tailwind CSS**.
In development, content is stored as JSON in `data/content.json` and uploaded
images live in `public/uploads/`. On Vercel, the same data is stored in Vercel
Blob (see [Deployment](#deployment-on-vercel)).

---

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The admin CMS is at `/login`
(development password: `spartans`).

## Scripts

| Command            | Purpose                              |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the development server         |
| `npm run build`    | Production build                     |
| `npm run start`    | Serve the production build           |
| `npm run typecheck`| Type-check without emitting files    |

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you need.

| Variable               | Required | Purpose                                                        |
| ---------------------- | -------- | -------------------------------------------------------------- |
| `ADMIN_PASSWORD`       | **Yes (prod)** | Password for `/login`. Without it, admin access is disabled in production. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URL used for metadata, `robots.txt` and `sitemap.xml`. |
| `BLOB_PUBLIC_READ_WRITE_TOKEN` | **Yes (Vercel)** | Read-write token for the **public** Blob store (photos and uploads). |
| `BLOB_PRIVATE_READ_WRITE_TOKEN` | **Yes (Vercel)** | Read-write token for the **private** Blob store (content, sync state, form submissions). |
| `CONTACT_WEBHOOK_URL`  | Optional | Where registration submissions are POSTed (Formspree, Zapier, Slack, n8n…). |
| `SUPPORT_WEBHOOK_URL`  | Optional | Where support/volunteer messages are POSTed. Falls back to `CONTACT_WEBHOOK_URL`, then private storage. |
| `INSTAGRAM_SYNC_ENABLED` | Optional | Set to `true` to enable the Instagram + TikTok sync worker. |
| `INSTAGRAM_SYNC_PUBLIC` | Optional | Set to `true` to allow one automatic social sync per 24 hours from a home-page visit. |
| `INSTAGRAM_ACCESS_TOKEN` | Optional | Official Instagram Graph API token. Without it, the public profile is read. |
| `TIKTOK_USERNAME`      | Optional | TikTok account to sync. Defaults to `spartanssocceraca`. |
| `TIKTOK_MAX_POSTS_PER_RUN` | Optional | Maximum new TikTok posts to import per run (default `2`, max `12`). |
| `SYNC_SECRET` / `CRON_SECRET` | Optional | Bearer secret for the cron/manual social sync endpoint. Vercel Cron uses `CRON_SECRET`. |
| `AI_API_KEY`           | Optional | Enables AI-written Instagram posts. Without it, the local template writer is used. |

> **Security:** in production the app never falls back to the development
> password. Set `ADMIN_PASSWORD` before deploying, and use a long random value.

## Admin

Sign in at `/login` to manage:

- **News & Blog** — articles, cover images, ordering
- **Gallery** — photos and videos, poster replacement, video URLs, ordering
- **Squad** — players, front/back photos, stats
- **Lineup** — drag-and-drop starting XI across 12 formations
- **Fixtures** — results, kick-off times, opponent logos
- **League Table** — standings with automatic club highlighting
- **Fees** — training times, fees and tournament details
- **Settings** — club details, contact numbers, social links, logo

Gallery cards can open either a photo or a self-hosted video. Synced TikTok
videos use a poster image in the grid and play natively in the lightbox without
loading TikTok's scripts. The official TikTok account (`@spartanssocceraca`) is
linked from the admin header only; public pages never link to `tiktok.com`.

Changes are saved explicitly with **Save changes**.

## Deployment on Vercel

Vercel's filesystem is read-only and ephemeral. The app therefore uses
**Cloudflare R2** in production and automatically falls back to the local
filesystem during development.

### Create an R2 bucket

1. In Cloudflare Dashboard, go to **R2 Object Storage** → **Create bucket**
2. Name it `spartans-media` (or any name you like)
3. Leave **Public access** off
4. Create **Manage R2 API Tokens** → **Create API token**
5. Copy the **Access Key ID** and **Secret Access Key**
6. Copy the **Endpoint** URL (e.g. `https://<account-id>.r2.cloudflarestorage.com`)
7. (Optional) Add a **Custom domain** in R2 → Settings → Custom domains
   (e.g. `https://media.spartanssocceracademy.com`) and set it as
   `R2_PUBLIC_URL`

Set these variables in the Vercel project (Production, Preview and
Development as needed):

### Required environment variables

```bash
ADMIN_PASSWORD=...
NEXT_PUBLIC_SITE_URL=https://your-domain.example
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=spartans-media
R2_PUBLIC_URL=https://media.yourdomain.com   # optional custom domain
CRON_SECRET=...            # for the daily Instagram + TikTok sync
```

### What lives where

| Data | Storage | Access |
| ---- | ------- | ------ |
| Site content (`data/content.json`) | Private R2 object | Server only |
| Form submissions | Private R2 object, one object per submission | Server only |
| Instagram/TikTok sync state and locks | Private R2 object | Server only |
| Gallery, news covers, admin uploads | Public R2 object | Public URL via `R2_PUBLIC_URL` |
| Synced TikTok videos and posters | Public R2 object | Public URL via `R2_PUBLIC_URL` |

Existing images committed to `public/` (crest, icons, favicon, imported
gallery photos) continue to work and are bundled with the deployment.

Uploads go **directly from the browser to Cloudflare R2** via a short-lived
presigned URL, so phone photos larger than Vercel's ~4.5 MB function request
limit still work. The admin route validates the admin session, image type
(PNG, JPEG, WebP or GIF; SVG is rejected) and an 8 MB size limit before
issuing a presigned upload URL.

### Contact form

Submissions go to `CONTACT_WEBHOOK_URL` when set. Otherwise they are stored as
private Blob objects on Vercel (or appended to `data/messages.ndjson` on a
persistent local disk). Configure a webhook to get instant notifications.

The support/volunteer form works the same way: `SUPPORT_WEBHOOK_URL`, then
`CONTACT_WEBHOOK_URL`, then private storage.

## Automatic Instagram + TikTok updates

One sync run checks both official accounts. It needs **no API keys** by default:

- `src/lib/instagram-sync.ts` reads the public profile of
  `@spartanssocceracademy` when no `INSTAGRAM_ACCESS_TOKEN` is configured. New
  posts become a gallery item and a news article.
- `src/lib/tiktok-sync.ts` reads the public TikTok embed for
  `@spartanssocceraca`. New posts are imported into the gallery as self-hosted
  videos (or a poster-only item for photo posts). TikTok dates are decoded from
  the numeric post ID, so the gallery stays in chronological order.
- Both workers run sequentially under a shared lock so one cannot overwrite the
  other's content changes.

Enable sync in `.env.local`:

```bash
INSTAGRAM_SYNC_ENABLED=true
# optional: also check once per day when someone visits the home page
INSTAGRAM_SYNC_PUBLIC=true
INSTAGRAM_MAX_POSTS_PER_RUN=2
TIKTOK_MAX_POSTS_PER_RUN=2
```

A visible **Sync socials** button is available at **Admin → News & Blog**.
`vercel.json` contains a daily 06:00 schedule; set `CRON_SECRET` in Vercel (or
`SYNC_SECRET` on another host) so the cron request is authorised. You can also
invoke it manually:

```bash
# Instagram + TikTok
curl -X POST "https://your-site.example/api/instagram/sync?force=1" \
  -H "Authorization: Bearer $SYNC_SECRET"

# just one source, useful for a manual TikTok backfill
curl -X POST "https://your-site.example/api/instagram/sync?force=1&source=tiktok" \
  -H "Authorization: Bearer $SYNC_SECRET"
```

State lives in private R2 storage on Vercel (or
`data/instagram-sync.json` and `data/tiktok-sync.json` locally). New Instagram
covers and TikTok posters/videos are written to the public R2 store (or
`public/gallery/` and `public/videos/` locally). Posts already present in the
gallery are skipped, so it is safe to run often.

> **Reliability:** public profile scraping can be rate-limited or changed by
> Instagram. For production, configure the official Graph API with
> `INSTAGRAM_ACCESS_TOKEN` and `INSTAGRAM_USER_ID`. The public path is a
> keyless fallback, not a guarantee. TikTok's embed endpoint is likewise a
> public endpoint and may change; failures are logged without breaking the
> site.

## Project structure

```
src/app/            Routes (public site, admin, API)
src/components/     Shared UI + admin editor components
src/lib/            Content store, Blob storage, auth, formations, helpers
data/content.json   Default/seed site content (editable via the CMS)
public/brand/       Logo and icon assets
```
