# 0xKiire.coredumped — Static blog

## Features
- Markdown-based posts in `src/blogs`
- Tags, search, pagination, read time, TOC
- Syntax highlighting (Prism), KaTeX
- Service Worker (offline)
- RSS & sitemap generation
- Cloudflare Pages ready (`src` is build output)

## Local dev
1. `npm install`
2. Add posts to `src/blogs/*.md` with optional frontmatter:
3. `npm run build` (generates `src/blogs/index.json`, `src/rss.xml`, `src/sitemap.xml`)
4. `npm start` to preview `src/` locally

## Deploy to Cloudflare Pages
1. Push the repo to GitHub
2. In Cloudflare Pages, create a new project and connect repo
3. Set **Build command**: (none)
4. Set **Build output directory**: `src`
5. Deploy

## Notes
- Replace Giscus repo & category IDs in `app.js`.
- For large sites, consider adding a pre-render / SSG pipeline.
