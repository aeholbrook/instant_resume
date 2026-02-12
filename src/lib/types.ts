export interface ProjectFrontmatter {
  title: string;
  date: string;
  description: string;
  coverImage: string;
  images: string[];
  tags: string[];
  featured?: boolean;
}

export interface Project extends ProjectFrontmatter {
  slug: string;
  content: string;
}

export interface BlogPostFrontmatter {
  title: string;
  date: string;
  description: string;
  coverImage: string;
}

export interface BlogPost extends BlogPostFrontmatter {
  slug: string;
  content: string;
}

export interface Gallery {
  slug: string;
  title: string;
  images: string[];
}

export interface GalleryLink {
  slug: string;
  title: string;
  href: string;
}

export interface SiteAssets {
  logoUrl: string;
  homePortraitUrl: string;
  aboutPortraitUrl: string;
}

export interface AboutPage {
  title: string;
  content: string;
  imageUrl: string;
}

export interface HeroContent {
  portraitImageUrl: string;
  filmImages: string[];
  galleryHref: string;
}
