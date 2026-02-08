# Archive

This directory contains features that have been temporarily disabled but may be re-enabled in the future.

## Projects Section

The projects section has been archived:
- `projects/` - App routes and pages for project display
- `content-projects/` - Markdown content for projects
- `ProjectCard.tsx` - React component for displaying project cards

To re-enable the projects section:
1. Move `projects/` back to `src/app/projects/`
2. Move `content-projects/` back to `content/projects/`
3. Move `ProjectCard.tsx` back to `src/components/`
4. Uncomment the Projects link in `src/components/Sidebar.tsx` and `src/components/MobileNav.tsx`
5. Update `src/app/page.tsx` to display featured projects
