-- Core schema for Neon-backed site content + R2 image references.
-- Run this file against your Neon database before deploying to Vercel.

CREATE TABLE IF NOT EXISTS galleries (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  nav_order INTEGER NOT NULL DEFAULT 100,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id BIGSERIAL PRIMARY KEY,
  gallery_slug TEXT NOT NULL REFERENCES galleries(slug) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gallery_images_gallery_slug_idx
  ON gallery_images (gallery_slug, sort_order, id);

CREATE TABLE IF NOT EXISTS blog_posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE,
  description TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  content_markdown TEXT,
  content_html TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content_markdown TEXT,
  content_html TEXT,
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_assets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS film_carousel_images (
  id BIGSERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO galleries (slug, title, nav_order)
VALUES
  ('portraits', 'Portraits', 10),
  ('landscapes', 'Landscapes', 20),
  ('events', 'Events', 30),
  ('weddings', 'Weddings', 40),
  ('crab-orchard', 'Crab Orchard', 50),
  ('scotland', 'Scotland', 60),
  ('objects', 'Objects', 70)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    nav_order = EXCLUDED.nav_order;

INSERT INTO pages (slug, title, content_markdown, image_url)
VALUES (
  'about',
  'About',
  'Add your about-page markdown here.',
  'images/about/about_page_adam.webp'
)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    content_markdown = EXCLUDED.content_markdown,
    image_url = EXCLUDED.image_url;

INSERT INTO site_assets (key, value)
VALUES
  ('logo_url', 'images/logo.webp'),
  ('home_portrait_url', 'images/quarantine-self-portrait.webp'),
  ('about_portrait_url', 'images/about/about_page_adam.webp')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;
