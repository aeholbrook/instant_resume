import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import {
  AboutPage,
  BlogPost,
  Gallery,
  GalleryLink,
  HeroContent,
  Project,
  SiteAssets,
} from "./types";
import { getSql } from "./db";
import { toR2Url } from "./r2";

const contentDirectory = path.join(process.cwd(), "content");
const projectsDirectory = path.join(contentDirectory, "projects");
const blogDirectory = path.join(contentDirectory, "blog");
const galleriesDirectory = path.join(process.cwd(), "public", "images", "galleries");
const filmCarouselDirectory = path.join(process.cwd(), "public", "images", "film-carousel");

const fallbackGalleryMeta: Record<string, string> = {
  portraits: "Portraits",
  landscapes: "Landscapes",
  events: "Events",
  weddings: "Weddings",
  "crab-orchard": "Crab Orchard",
  scotland: "Scotland",
  objects: "Objects",
};

const fallbackSiteAssets: SiteAssets = {
  logoUrl: "/images/logo.webp",
  homePortraitUrl: "/images/quarantine-self-portrait.webp",
  aboutPortraitUrl: "/images/about/about_page_adam.webp",
};

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(markdown);

  return result.toString();
}

function getMdFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((f) => f.endsWith(".md"));
}

function toDateString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function normalizeAssetUrl(pathOrUrl: string): string {
  return toR2Url(pathOrUrl);
}

type DbRow = Record<string, unknown>;

function asDbRows(result: unknown): DbRow[] {
  return Array.isArray(result) ? (result as DbRow[]) : [];
}

async function getDbGalleryLinks(): Promise<GalleryLink[] | null> {
  const sql = getSql();
  if (!sql) return null;

  try {
    const rows = asDbRows(await sql`
      SELECT slug, title
      FROM galleries
      WHERE is_published = TRUE
      ORDER BY nav_order ASC NULLS LAST, title ASC
    `);

    return rows.map((row) => {
      const slug = String(row.slug);
      return {
        slug,
        title: String(row.title),
        href: `/galleries/${slug}/`,
      };
    });
  } catch {
    return null;
  }
}

function getFallbackGalleryLinks(): GalleryLink[] {
  return Object.entries(fallbackGalleryMeta).map(([slug, title]) => ({
    slug,
    title,
    href: `/galleries/${slug}/`,
  }));
}

export async function getGalleryLinks(): Promise<GalleryLink[]> {
  const dbLinks = await getDbGalleryLinks();
  if (dbLinks && dbLinks.length > 0) {
    return dbLinks;
  }
  return getFallbackGalleryLinks();
}

export async function getGallerySlugs(): Promise<string[]> {
  const links = await getGalleryLinks();
  return links.map((link) => link.slug);
}

async function getFallbackGallery(slug: string): Promise<Gallery | null> {
  const dir = path.join(galleriesDirectory, slug);
  const hasLocalDirectory = fs.existsSync(dir);

  if (!hasLocalDirectory && !fallbackGalleryMeta[slug]) {
    return null;
  }

  const images = hasLocalDirectory
    ? fs
        .readdirSync(dir)
        .filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f))
        .sort()
        .map((f) => normalizeAssetUrl(`/images/galleries/${slug}/${f}`))
    : [];

  return {
    slug,
    title: fallbackGalleryMeta[slug] ?? titleFromSlug(slug),
    images,
  };
}

export async function getGallery(slug: string): Promise<Gallery | null> {
  const sql = getSql();

  if (sql) {
    try {
      const galleryRows = asDbRows(await sql`
        SELECT slug, title
        FROM galleries
        WHERE slug = ${slug} AND is_published = TRUE
        LIMIT 1
      `);

      if (galleryRows.length === 0) {
        return getFallbackGallery(slug);
      }

      const imageRows = asDbRows(await sql`
        SELECT image_url
        FROM gallery_images
        WHERE gallery_slug = ${slug}
        ORDER BY sort_order ASC NULLS LAST, id ASC
      `);

      return {
        slug: String(galleryRows[0].slug),
        title: String(galleryRows[0].title),
        images: imageRows.map((row) => normalizeAssetUrl(String(row.image_url))),
      };
    } catch {
      // Fall through to local filesystem fallback when DB schema isn't ready.
    }
  }

  return getFallbackGallery(slug);
}

export async function getAllGalleries(): Promise<Gallery[]> {
  const links = await getGalleryLinks();
  const galleries = await Promise.all(links.map((link) => getGallery(link.slug)));
  return galleries.filter((gallery): gallery is Gallery => gallery !== null);
}

async function getDbSiteAssets(): Promise<SiteAssets | null> {
  const sql = getSql();
  if (!sql) return null;

  try {
    const rows = asDbRows(await sql`SELECT key, value FROM site_assets`);
    if (rows.length === 0) {
      return null;
    }

    const values = new Map<string, string>();
    for (const row of rows) {
      values.set(String(row.key), String(row.value));
    }

    return {
      logoUrl: normalizeAssetUrl(values.get("logo_url") ?? fallbackSiteAssets.logoUrl),
      homePortraitUrl: normalizeAssetUrl(
        values.get("home_portrait_url") ?? fallbackSiteAssets.homePortraitUrl
      ),
      aboutPortraitUrl: normalizeAssetUrl(
        values.get("about_portrait_url") ?? fallbackSiteAssets.aboutPortraitUrl
      ),
    };
  } catch {
    return null;
  }
}

export async function getSiteAssets(): Promise<SiteAssets> {
  const dbAssets = await getDbSiteAssets();
  if (dbAssets) return dbAssets;

  return {
    logoUrl: normalizeAssetUrl(fallbackSiteAssets.logoUrl),
    homePortraitUrl: normalizeAssetUrl(fallbackSiteAssets.homePortraitUrl),
    aboutPortraitUrl: normalizeAssetUrl(fallbackSiteAssets.aboutPortraitUrl),
  };
}

async function getDbFilmCarouselImages(): Promise<string[] | null> {
  const sql = getSql();
  if (!sql) return null;

  try {
    const rows = asDbRows(await sql`
      SELECT image_url
      FROM film_carousel_images
      ORDER BY sort_order ASC NULLS LAST, id ASC
    `);

    if (rows.length === 0) {
      return null;
    }

    return rows.map((row) => normalizeAssetUrl(String(row.image_url)));
  } catch {
    return null;
  }
}

function getFallbackFilmCarouselImages(): string[] {
  if (!fs.existsSync(filmCarouselDirectory)) return [];

  return fs
    .readdirSync(filmCarouselDirectory)
    .filter((file) => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
    .map((file) => normalizeAssetUrl(`/images/film-carousel/${file}`));
}

export async function getFilmCarouselImages(): Promise<string[]> {
  const dbImages = await getDbFilmCarouselImages();
  if (dbImages) return dbImages;
  return getFallbackFilmCarouselImages();
}

export async function getHeroContent(): Promise<HeroContent> {
  const [assets, filmImages, galleryLinks] = await Promise.all([
    getSiteAssets(),
    getFilmCarouselImages(),
    getGalleryLinks(),
  ]);

  return {
    portraitImageUrl: assets.homePortraitUrl,
    filmImages,
    galleryHref: galleryLinks[0]?.href ?? "/galleries/",
  };
}

async function getFallbackAboutPage(): Promise<AboutPage> {
  const assets = await getSiteAssets();
  const filePath = path.join(contentDirectory, "about.md");
  if (!fs.existsSync(filePath)) {
    return {
      title: "About",
      content: "",
      imageUrl: assets.aboutPortraitUrl,
    };
  }

  const fileContents = fs.readFileSync(filePath, "utf-8");
  const { content } = matter(fileContents);

  return {
    title: "About",
    content: await markdownToHtml(content),
    imageUrl: assets.aboutPortraitUrl,
  };
}

export async function getAboutPage(): Promise<AboutPage> {
  const sql = getSql();
  const assets = await getSiteAssets();

  if (sql) {
    try {
      const rows = asDbRows(await sql`
        SELECT title, content_markdown, content_html, image_url
        FROM pages
        WHERE slug = 'about' AND is_published = TRUE
        LIMIT 1
      `);

      if (rows.length > 0) {
        const row = rows[0];
        const markdown = row.content_markdown ? String(row.content_markdown) : "";
        const content =
          row.content_html && String(row.content_html).length > 0
            ? String(row.content_html)
            : markdown
              ? await markdownToHtml(markdown)
              : "";

        return {
          title: row.title ? String(row.title) : "About",
          content,
          imageUrl: row.image_url
            ? normalizeAssetUrl(String(row.image_url))
            : assets.aboutPortraitUrl,
        };
      }
    } catch {
      // Fall through to markdown fallback.
    }
  }

  return getFallbackAboutPage();
}

export async function getAboutContent(): Promise<string> {
  const aboutPage = await getAboutPage();
  return aboutPage.content;
}

function getProjectSlugs(): string[] {
  return getMdFiles(projectsDirectory).map((f) => f.replace(/\.md$/, ""));
}

export async function getProjectBySlug(slug: string): Promise<Project> {
  const filePath = path.join(projectsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContents);
  const html = await markdownToHtml(content);

  return {
    slug,
    title: data.title ?? "",
    date: data.date ?? "",
    description: data.description ?? "",
    coverImage: data.coverImage ? normalizeAssetUrl(String(data.coverImage)) : "",
    images: (data.images ?? []).map((image: string) => normalizeAssetUrl(image)),
    tags: data.tags ?? [],
    featured: data.featured ?? false,
    content: html,
  };
}

export async function getProjects(): Promise<Project[]> {
  const slugs = getProjectSlugs();
  const projects = await Promise.all(slugs.map(getProjectBySlug));
  return projects.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

function getBlogSlugs(): string[] {
  return getMdFiles(blogDirectory).map((f) => f.replace(/\.md$/, ""));
}

async function rowToBlogPost(row: Record<string, unknown>): Promise<BlogPost> {
  const markdown = row.content_markdown ? String(row.content_markdown) : "";
  const content =
    row.content_html && String(row.content_html).length > 0
      ? String(row.content_html)
      : markdown
        ? await markdownToHtml(markdown)
        : "";

  return {
    slug: String(row.slug),
    title: String(row.title ?? ""),
    date: toDateString(row.date ?? row.published_at),
    description: String(row.description ?? ""),
    coverImage: row.cover_image_url
      ? normalizeAssetUrl(String(row.cover_image_url))
      : "",
    content,
  };
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const sql = getSql();

  if (sql) {
    try {
      const rows = asDbRows(await sql`
        SELECT slug, title, date, description, cover_image_url, content_markdown, content_html, published_at
        FROM blog_posts
        WHERE slug = ${slug} AND is_published = TRUE
        LIMIT 1
      `);

      if (rows.length > 0) {
        return rowToBlogPost(rows[0]);
      }

      return null;
    } catch {
      // Fall through to markdown fallback.
    }
  }

  const filePath = path.join(blogDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContents);
  const html = await markdownToHtml(content);

  return {
    slug,
    title: data.title ?? "",
    date: data.date ?? "",
    description: data.description ?? "",
    coverImage: data.coverImage ? normalizeAssetUrl(String(data.coverImage)) : "",
    content: html,
  };
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const sql = getSql();

  if (sql) {
    try {
      const rows = asDbRows(await sql`
        SELECT slug, title, date, description, cover_image_url, content_markdown, content_html, published_at
        FROM blog_posts
        WHERE is_published = TRUE
        ORDER BY date DESC NULLS LAST, published_at DESC NULLS LAST, slug ASC
      `);

      const posts = await Promise.all(rows.map((row) => rowToBlogPost(row)));
      return posts;
    } catch {
      // Fall through to markdown fallback.
    }
  }

  const slugs = getBlogSlugs();
  const posts = await Promise.all(slugs.map(async (slug) => getBlogPostBySlug(slug)));
  const validPosts = posts.filter((post): post is BlogPost => post !== null);

  return validPosts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
