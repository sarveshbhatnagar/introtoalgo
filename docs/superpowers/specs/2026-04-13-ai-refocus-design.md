# Design: Refocus introtoalgo.com to AI/LLMs + SEO Overhaul

**Date:** 2026-04-13  
**Status:** Approved

---

## Overview

Refocus introtoalgo.com from algorithms & CS to practical AI/LLM content (prompting, RAG, agents, fine-tuning). All existing posts are archived — kept at their original URLs to preserve SEO equity — and the homepage is rebuilt for the new direction. A full SEO treatment is applied across all pages.

---

## Section 1 — Archive

### Goal
Preserve existing content and its URL equity while clearing the homepage for new AI/LLM posts.

### Changes
- Add `archived: true` to all 7 existing posts in `assets/js/posts.js`
- `index.html` filters: only posts without `archived: true` appear in featured + listing
- New `archive.html` page: shows only posts with `archived: true`, labeled "Legacy Content — Algorithms & CS"
- `assets/js/navbar.js`: add "Archive" nav link
- `posts/*.html` files: content and URLs untouched — only meta/semantic markup updated (see Section 3)

### Files touched
- `assets/js/posts.js`
- `index.html` (filter logic)
- `archive.html` (new file)
- `assets/js/navbar.js`

---

## Section 2 — New AI/LLM Homepage Content

### Goal
Give the homepage a clear new identity and populate it with placeholder posts that demonstrate the new direction.

### Changes

**Hero text** — rewritten to reflect AI/LLM practical focus:
- Eyebrow: `artificial intelligence & large language models`
- Title: `Learn to build with` / `AI.`
- Subtitle: Practical guides on prompting, RAG pipelines, LLM agents, and fine-tuning — from first principles to production.

**3 placeholder posts** added to `posts.js`:

| # | Title | Tag | Featured |
|---|-------|-----|----------|
| 1 | Prompt Engineering Fundamentals | Prompting | yes |
| 2 | Building a RAG Pipeline from Scratch | RAG | no |
| 3 | LLM Agents: How They Work | Agents | no |

- All placeholder posts link to `posts/coming-soon.html` (a single stub page)
- `coming-soon.html` uses existing blog.css, states article is in progress

### Files touched
- `assets/js/posts.js`
- `index.html` (hero text)
- `posts/coming-soon.html` (new file)

---

## Section 3 — SEO

### Goal
Make every page easily discoverable by Google and other search engines.

### Changes

**Meta & Open Graph** (all pages):
- Accurate `<title>` tags (format: `Post Title — introtoalgo`)
- `<meta name="description">` — unique, keyword-rich, under 160 chars
- Open Graph: `og:title`, `og:description`, `og:type`, `og:url`, `og:image`
- Twitter card: `twitter:card`, `twitter:title`, `twitter:description`

**Canonical URLs** (all pages):
- `<link rel="canonical" href="https://introtoalgo.com/...">` on every page

**JSON-LD structured data**:
- Post pages: `Article` schema (headline, datePublished, author, image, url)
- Index/archive/category: `WebSite` schema + `BreadcrumbList`

**`sitemap.xml`** (new file at root):
- Lists: `index.html`, `archive.html`, `algos.html`, `generic.html`, `category.html`, all `posts/*.html`
- Includes `<lastmod>`, `<changefreq>`, `<priority>`

**`robots.txt`** (new file at root):
- `User-agent: *` / `Allow: /`
- `Sitemap: https://introtoalgo.com/sitemap.xml`

**Semantic HTML** (post pages):
- Wrap post content in `<article>`
- `<span class="post-date">` → `<time datetime="YYYY-MM-DD">`
- Audit heading hierarchy (no skipped h1→h3)

### Files touched
- All `*.html` pages (meta/OG/canonical)
- All `posts/*.html` (JSON-LD, semantic HTML)
- `sitemap.xml` (new)
- `robots.txt` (new)

---

## Out of Scope
- No build system introduced — site remains static HTML/CSS/JS
- No new CSS framework
- No changes to existing post content (only meta/semantic markup)
- No redirect rules (URLs unchanged)
