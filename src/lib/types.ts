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
