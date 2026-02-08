import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { Project, BlogPost, Gallery } from "./types";

const contentDirectory = path.join(process.cwd(), "content");
const projectsDirectory = path.join(contentDirectory, "projects");
const blogDirectory = path.join(contentDirectory, "blog");

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

export function getProjectSlugs(): string[] {
  return getMdFiles(projectsDirectory).map((f) => f.replace(/\.md$/, ""));
}

export function getBlogSlugs(): string[] {
  return getMdFiles(blogDirectory).map((f) => f.replace(/\.md$/, ""));
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
    coverImage: data.coverImage ?? "",
    images: data.images ?? [],
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

export async function getBlogPostBySlug(slug: string): Promise<BlogPost> {
  const filePath = path.join(blogDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContents);
  const html = await markdownToHtml(content);

  return {
    slug,
    title: data.title ?? "",
    date: data.date ?? "",
    description: data.description ?? "",
    coverImage: data.coverImage ?? "",
    content: html,
  };
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const slugs = getBlogSlugs();
  const posts = await Promise.all(slugs.map(getBlogPostBySlug));
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

const galleriesDirectory = path.join(process.cwd(), "public", "images", "galleries");

const galleryMeta: Record<string, string> = {
  portraits: "Portraits",
  landscapes: "Landscapes",
  events: "Events",
  weddings: "Weddings",
  "crab-orchard": "Crab Orchard",
  scotland: "Scotland",
  objects: "Objects",
};

export function getGallerySlugs(): string[] {
  return Object.keys(galleryMeta);
}

export function getGallery(slug: string): Gallery {
  const dir = path.join(galleriesDirectory, slug);
  let images: string[] = [];
  if (fs.existsSync(dir)) {
    images = fs
      .readdirSync(dir)
      .filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f))
      .sort()
      .map((f) => `/images/galleries/${slug}/${f}`);
  }
  return {
    slug,
    title: galleryMeta[slug] ?? slug,
    images,
  };
}

export function getAllGalleries(): Gallery[] {
  return getGallerySlugs().map(getGallery);
}

export async function getAboutContent(): Promise<string> {
  const filePath = path.join(contentDirectory, "about.md");
  if (!fs.existsSync(filePath)) return "";
  const fileContents = fs.readFileSync(filePath, "utf-8");
  const { content } = matter(fileContents);
  return markdownToHtml(content);
}
