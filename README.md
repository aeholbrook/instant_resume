# Portfolio Site

Next.js portfolio site with:
- Page and gallery metadata from Neon Postgres
- Image URLs served from Cloudflare R2 (public URL)
- Deployment target: Vercel

## Local development

1. Install dependencies:
   `npm install`
2. Create env file:
   `cp .env.example .env.local`
3. Set:
   - `DATABASE_URL` to your Neon connection string
   - `R2_PUBLIC_BASE_URL` to your public R2 domain (for example `https://cdn.example.com`)
4. Run the DB schema:
   `psql "$DATABASE_URL" -f db/schema.sql`
5. Start dev server:
   `npm run dev`

If `DATABASE_URL` is not set, the app falls back to local filesystem content under `content/` and `public/images/`.

## Neon data model

The runtime queries these tables:
- `galleries`
- `gallery_images`
- `pages` (uses `slug = 'about'`)
- `blog_posts`
- `site_assets` (`logo_url`, `home_portrait_url`, `about_portrait_url`)
- `film_carousel_images`

`db/schema.sql` creates all required tables and baseline rows.

## R2 image paths

Store R2 object keys (or full URLs) in DB image columns:
- `gallery_images.image_url`
- `blog_posts.cover_image_url`
- `pages.image_url`
- `site_assets.value`
- `film_carousel_images.image_url`

When a value is not an absolute URL, the app prefixes it with `R2_PUBLIC_BASE_URL`.

## Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the project into Vercel.
3. In Vercel project settings, add environment variables:
   - `DATABASE_URL`
   - `R2_PUBLIC_BASE_URL`
4. Deploy.

The app now runs as a server-rendered Next.js app (not static export), so Neon-backed content is loaded at runtime.
