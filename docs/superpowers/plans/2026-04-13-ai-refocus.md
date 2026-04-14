# AI/LLM Refocus + SEO Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refocus introtoalgo.com from algorithms/CS to practical AI/LLM content, archive legacy posts, and apply a full SEO treatment across every page.

**Architecture:** Add `archived: true` flag to the 7 legacy posts in `posts.js` (single source of truth); homepage and category pages filter archived posts out; `archive.html` shows only archived posts. Three placeholder AI/LLM posts are added. SEO meta, Open Graph, canonical, JSON-LD, `sitemap.xml`, and `robots.txt` are applied to every page.

**Tech Stack:** Static HTML/CSS/vanilla JS. No build system. No test framework — verification is visual/source inspection in a browser.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `assets/js/posts.js` | Modify | Add `archived: true` to 7 legacy posts; add 3 AI placeholder posts |
| `index.html` | Modify | Filter archived posts; rewrite hero; add full SEO head tags |
| `assets/js/navbar.js` | Modify | Add Archive nav link + active-state detection |
| `archive.html` | Create | Lists only archived posts |
| `posts/coming-soon.html` | Create | Stub page for placeholder AI posts |
| `algos.html` | Modify | Add SEO head tags |
| `generic.html` | Modify | Add SEO head tags |
| `category.html` | Modify | Exclude archived posts from filter; add SEO head tags |
| `posts/mst.html` | Modify | SEO head tags + semantic HTML |
| `posts/communitydetection.html` | Modify | SEO head tags + semantic HTML |
| `posts/semanticnetworks.html` | Modify | SEO head tags + semantic HTML |
| `posts/networktheory.html` | Modify | SEO head tags + semantic HTML |
| `posts/markovchains.html` | Modify | SEO head tags + semantic HTML |
| `posts/speedinguplinkedlist.html` | Modify | SEO head tags + semantic HTML |
| `posts/mergesort.html` | Modify | SEO head tags + semantic HTML |
| `sitemap.xml` | Create | Full site sitemap for Google |
| `robots.txt` | Create | Allow crawling, point to sitemap |

---

## Task 1: Archive legacy posts + fix index.html filter

**Files:**
- Modify: `assets/js/posts.js`
- Modify: `index.html`

- [ ] **Step 1: Add `archived: true` to all 7 legacy posts in `posts.js`**

Replace the entire `var POSTS = [...]` block with:

```javascript
/* ================================================================
   posts.js — single source of truth for all blog posts
   ================================================================
   Fields:
     title    {string}  — post headline
     url      {string}  — path from site root
     date     {string}  — e.g. "March 22, 2026"
     tag      {string}  — category label
     excerpt  {string}  — one or two sentence description
     image    {string}  — cover image path (optional)
     featured {boolean} — set true on exactly one non-archived post
     archived {boolean} — true = legacy post, hidden from homepage
================================================================ */
var POSTS = [
  /* ── AI / LLM posts ────────────────────────────────────────── */
  {
    title:    "Prompt Engineering Fundamentals",
    url:      "posts/coming-soon.html",
    date:     "April 10, 2026",
    tag:      "Prompting",
    excerpt:  "A practical guide to writing effective prompts — from zero-shot and few-shot techniques to chain-of-thought and structured output patterns.",
    featured: true
  },
  {
    title:    "Building a RAG Pipeline from Scratch",
    url:      "posts/coming-soon.html",
    date:     "April 5, 2026",
    tag:      "RAG",
    excerpt:  "Step-by-step walkthrough of retrieval-augmented generation: chunking, embedding, vector stores, retrieval strategies, and generation with context."
  },
  {
    title:    "LLM Agents: How They Work",
    url:      "posts/coming-soon.html",
    date:     "April 1, 2026",
    tag:      "Agents",
    excerpt:  "Tool use, planning loops, and agent architectures — how LLMs go from answering questions to taking actions in the world."
  },

  /* ── Archived (legacy) posts ────────────────────────────────── */
  {
    title:    "Minimum Spanning Tree",
    url:      "posts/mst.html",
    date:     "April 25, 2017",
    tag:      "Graph Theory",
    excerpt:  "Minimum spanning tree spans all nodes at minimum aggregate cost. Essential for approximation algorithms, routing protocols, and real-time face verification.",
    image:    "images/mst.jpg",
    archived: true
  },
  {
    title:    "Community Detection: Introduction",
    url:      "posts/communitydetection.html",
    date:     "April 24, 2017",
    tag:      "Graph Theory",
    excerpt:  "A community is densely intra-connected and sparsely inter-connected. Community Detection is the process of finding such structures in a network.",
    image:    "images/communitydetection.jpg",
    archived: true
  },
  {
    title:    "Semantic Networks: Basics",
    url:      "posts/semanticnetworks.html",
    date:     "April 22, 2017",
    tag:      "AI",
    excerpt:  "Semantic networks are graphical representations of the interconnections between nodes — the backbone of knowledge representation in Artificial Intelligence.",
    image:    "images/semanticnets.jpg",
    archived: true
  },
  {
    title:    "Network Theory (Graph Theory)",
    url:      "posts/networktheory.html",
    date:     "April 18, 2017",
    tag:      "Graph Theory",
    excerpt:  "Graphs are sets of vertices connected by edges. This field underlies social networks, routing, compilers, and more.",
    image:    "images/graphtheory.jpg",
    archived: true
  },
  {
    title:    "Markov Chains: Basics",
    url:      "posts/markovchains.html",
    date:     "April 14, 2017",
    tag:      "Probability",
    excerpt:  "A Markov chain is a stochastic model where the probability of each event depends only on the state attained in the previous event.",
    image:    "images/markovchain.png",
    archived: true
  },
  {
    title:    "Speeding Up Linked Lists",
    url:      "posts/speedinguplinkedlist.html",
    date:     "April 11, 2017",
    tag:      "Data Structures",
    excerpt:  "Linked list is a fundamental data structure used in countless applications. Exploring techniques to optimize it for real-world performance.",
    image:    "images/speedlinked.jpg",
    archived: true
  },
  {
    title:    "Merge Sort",
    url:      "posts/mergesort.html",
    date:     "April 7, 2017",
    tag:      "Algorithms",
    excerpt:  "Merge sort uses the divide-and-conquer paradigm — breaking the problem into parts, sorting each, then merging the results back together.",
    image:    "images/mergesort.png",
    archived: true
  }
];
```

- [ ] **Step 2: Update index.html — filter archived posts from featured + listing**

In `index.html`, find this line in the inline `<script>`:

```javascript
  var fp  = POSTS.find(function(p) { return p.featured; }) || POSTS[0];
```

Replace with:

```javascript
  var active = POSTS.filter(function(p) { return !p.archived; });
  var fp  = active.find(function(p) { return p.featured; }) || active[0];
```

Then find:

```javascript
  var others = POSTS.filter(function(p) { return !p.featured; });
```

Replace with:

```javascript
  var others = active.filter(function(p) { return !p.featured; });
```

- [ ] **Step 3: Open index.html in browser and verify**

Open `index.html` in a browser. Confirm:
- Featured post shows "Prompt Engineering Fundamentals"
- Post list shows "Building a RAG Pipeline from Scratch" and "LLM Agents: How They Work"
- No algorithm/CS posts appear on the homepage

- [ ] **Step 4: Commit**

```bash
git add assets/js/posts.js index.html
git commit -m "feat: archive legacy posts, add AI/LLM placeholder posts"
```

---

## Task 2: Add Archive nav link to navbar.js

**Files:**
- Modify: `assets/js/navbar.js`

- [ ] **Step 1: Add archive active-state detection and nav link**

In `assets/js/navbar.js`, find:

```javascript
  var isAlgos   = /algos\.html/.test(path);
  var isAbout   = /generic\.html/.test(path);
  var isCategory = /category\.html/.test(path);
  var isBlog    = !isAlgos && !isAbout && !isCategory;
```

Replace with:

```javascript
  var isAlgos   = /algos\.html/.test(path);
  var isAbout   = /generic\.html/.test(path);
  var isCategory = /category\.html/.test(path);
  var isArchive = /archive\.html/.test(path);
  var isBlog    = !isAlgos && !isAbout && !isCategory && !isArchive;
```

Then find the nav HTML block:

```javascript
      '<nav class="site-nav">' +
        '<a href="' + root + 'index.html"  class="nav-link' + (isBlog    ? ' active' : '') + '">Blog</a>'  +
        '<a href="' + root + 'algos.html"  class="nav-link' + (isAlgos   ? ' active' : '') + '">Algos</a>' +
        '<a href="' + root + 'generic.html" class="nav-link' + (isAbout  ? ' active' : '') + '">About</a>' +
      '</nav>' +
```

Replace with:

```javascript
      '<nav class="site-nav">' +
        '<a href="' + root + 'index.html"   class="nav-link' + (isBlog    ? ' active' : '') + '">Blog</a>'    +
        '<a href="' + root + 'algos.html"   class="nav-link' + (isAlgos   ? ' active' : '') + '">Algos</a>'   +
        '<a href="' + root + 'archive.html" class="nav-link' + (isArchive ? ' active' : '') + '">Archive</a>' +
        '<a href="' + root + 'generic.html" class="nav-link' + (isAbout   ? ' active' : '') + '">About</a>'   +
      '</nav>' +
```

- [ ] **Step 2: Verify**

Open `index.html` in a browser. Confirm the nav shows: Blog | Algos | Archive | About. "Blog" should be active (underlined/highlighted).

- [ ] **Step 3: Commit**

```bash
git add assets/js/navbar.js
git commit -m "feat: add Archive link to navbar"
```

---

## Task 3: Create archive.html

**Files:**
- Create: `archive.html`

- [ ] **Step 1: Create `archive.html`**

Create the file with this full content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Archive — introtoalgo</title>
  <meta name="description" content="Legacy algorithms and computer science posts from introtoalgo — covering graph theory, sorting, data structures, and probability.">
  <link rel="canonical" href="https://introtoalgo.com/archive.html">

  <!-- Open Graph -->
  <meta property="og:title" content="Archive — introtoalgo">
  <meta property="og:description" content="Legacy algorithms and computer science posts from introtoalgo — covering graph theory, sorting, data structures, and probability.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://introtoalgo.com/archive.html">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Archive — introtoalgo">
  <meta name="twitter:description" content="Legacy algorithms and computer science posts from introtoalgo.">

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Archive — introtoalgo",
    "description": "Legacy algorithms and computer science posts from introtoalgo.",
    "url": "https://introtoalgo.com/archive.html",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://introtoalgo.com/" },
        { "@type": "ListItem", "position": 2, "name": "Archive", "item": "https://introtoalgo.com/archive.html" }
      ]
    }
  }
  </script>

  <link rel="stylesheet" href="assets/css/blog.css">

  <script async src="https://www.googletagmanager.com/gtag/js?id=UA-116936620-1"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'UA-116936620-1');
  </script>
  <script data-ad-client="ca-pub-8611389211624701" async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>

  <style>
    .page-header {
      padding: 3.5rem 0 2.5rem;
      border-bottom: 1px solid var(--border);
      animation: fadeUp 0.5s ease both;
    }
    .page-eyebrow {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 1.2rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .page-eyebrow::after {
      content: '';
      display: block;
      width: 40px;
      height: 1px;
      background: var(--accent-dim);
    }
    .page-title {
      font-family: var(--font-display);
      font-size: clamp(2rem, 6vw, 3.2rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.05;
      color: var(--text);
      margin-bottom: 0.6rem;
    }
    .page-subtitle {
      font-size: 0.92rem;
      color: var(--text-dim);
      line-height: 1.6;
      max-width: 480px;
    }
    .section-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 2.5rem 0 1.5rem;
    }
    .section-label {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-dim);
      white-space: nowrap;
    }
    .section-line { flex: 1; height: 1px; background: var(--border); }
    .post-list { list-style: none; }
    .post-item {
      display: grid;
      grid-template-columns: 2.8rem 1fr auto;
      gap: 1.25rem;
      padding: 1.75rem 0;
      border-top: 1px solid var(--border);
      align-items: start;
      animation: fadeUp 0.5s ease both;
    }
    .post-item:last-child { border-bottom: 1px solid var(--border); }
    .post-item:nth-child(1) { animation-delay: 0.08s; }
    .post-item:nth-child(2) { animation-delay: 0.13s; }
    .post-item:nth-child(3) { animation-delay: 0.18s; }
    .post-item:nth-child(4) { animation-delay: 0.23s; }
    .post-item:nth-child(5) { animation-delay: 0.28s; }
    .post-item:nth-child(6) { animation-delay: 0.33s; }
    .post-item:nth-child(7) { animation-delay: 0.38s; }
    .post-num {
      font-family: var(--font-mono);
      font-size: 0.6rem;
      color: var(--text-dim);
      padding-top: 0.35rem;
    }
    .post-meta { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem; }
    .post-date {
      font-family: var(--font-mono);
      font-size: 0.63rem;
      letter-spacing: 0.1em;
      color: var(--text-dim);
      text-transform: uppercase;
    }
    .post-tag {
      font-family: var(--font-mono);
      font-size: 0.58rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
      background: var(--accent-bg);
      border: 1px solid rgba(200, 240, 71, 0.2);
      padding: 0.12rem 0.5rem;
      border-radius: 2px;
    }
    .post-item-title {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      line-height: 1.25;
      color: var(--text);
      margin-bottom: 0.35rem;
      transition: color 0.2s;
    }
    .post-item:hover .post-item-title { color: var(--accent); }
    .post-item-excerpt { font-size: 0.88rem; color: var(--text-mid); line-height: 1.55; }
    .post-thumb {
      width: 88px;
      height: 62px;
      object-fit: cover;
      border-radius: 2px;
      filter: grayscale(40%) brightness(0.7);
      transition: filter 0.3s;
      flex-shrink: 0;
    }
    .post-item:hover .post-thumb { filter: grayscale(0%) brightness(0.85); }
    @media (max-width: 600px) {
      .post-item { grid-template-columns: 2.2rem 1fr; }
      .post-thumb { display: none; }
    }
  </style>
</head>
<body>

<div class="wrap">

  <header class="page-header">
    <div class="page-eyebrow">legacy content</div>
    <h1 class="page-title">Archive</h1>
    <p class="page-subtitle">Original algorithms &amp; CS posts from 2017. Kept live at their original URLs to preserve links and search history.</p>
  </header>

  <div class="section-row">
    <span class="section-label">All Posts</span>
    <div class="section-line"></div>
  </div>

  <ul class="post-list" id="post-list"></ul>

  <footer class="site-footer">
    <span class="footer-text">&copy; introtoalgo</span>
    <span class="footer-text">By <a href="https://www.sarveshbhatnagar.com" target="_blank" rel="noopener">Sarvesh Bhatnagar</a></span>
  </footer>

</div>

<script src="assets/js/navbar.js"></script>
<script src="assets/js/posts.js"></script>
<script>
(function() {
  function pad(n) { return String(n).padStart(2, '0'); }

  var archived = POSTS.filter(function(p) { return p.archived; });
  var list = document.getElementById('post-list');

  list.innerHTML = archived.map(function(post, i) {
    var thumb = post.image
      ? '<a href="' + post.url + '"><img src="' + post.image + '" alt="' + post.title + '" class="post-thumb"></a>'
      : '';
    var tagHtml = post.tag
      ? '<span class="post-tag">' + post.tag + '</span>'
      : '';
    return '<li class="post-item">' +
      '<span class="post-num">' + pad(i + 1) + '</span>' +
      '<div>' +
        '<div class="post-meta"><time class="post-date">' + post.date + '</time>' + tagHtml + '</div>' +
        '<a href="' + post.url + '"><h3 class="post-item-title">' + post.title + '</h3></a>' +
        '<p class="post-item-excerpt">' + post.excerpt + '</p>' +
      '</div>' +
      thumb +
    '</li>';
  }).join('');
})();
</script>

</body>
</html>
```

- [ ] **Step 2: Open archive.html in browser and verify**

Confirm:
- Navbar shows Blog | Algos | Archive | About, with "Archive" active
- All 7 legacy posts listed with titles, tags, excerpts, and thumbnails
- No placeholder AI posts appear

- [ ] **Step 3: Commit**

```bash
git add archive.html
git commit -m "feat: add archive page for legacy algorithm posts"
```

---

## Task 4: Rewrite index.html hero + create coming-soon.html

**Files:**
- Modify: `index.html`
- Create: `posts/coming-soon.html`

- [ ] **Step 1: Rewrite hero section in index.html**

Find this block in `index.html`:

```html
  <!-- ── Hero ───────────────────────────────────────────────── -->
  <section class="hero">
    <div class="hero-eyebrow">algorithms &amp; computer science</div>
    <h1 class="hero-title">
      Learn the craft of<br><span class="hl">computation.</span>
    </h1>
    <p class="hero-sub">Deep dives into algorithms, data structures, graph theory, and the mathematical foundations that power modern software.</p>
  </section>
```

Replace with:

```html
  <!-- ── Hero ───────────────────────────────────────────────── -->
  <section class="hero">
    <div class="hero-eyebrow">artificial intelligence &amp; large language models</div>
    <h1 class="hero-title">
      Learn to build with<br><span class="hl">AI.</span>
    </h1>
    <p class="hero-sub">Practical guides on prompting, RAG pipelines, LLM agents, and fine-tuning — from first principles to production.</p>
  </section>
```

Also update the `<title>` tag in `index.html` from:

```html
  <title>introtoalgo — algorithms &amp; computer science</title>
```

to:

```html
  <title>introtoalgo — AI &amp; LLM Practical Guides</title>
```

And update the `<meta name="description">` from:

```html
  <meta name="description" content="Deep dives into algorithms, data structures, graph theory, and the mathematical foundations that power modern software.">
```

to:

```html
  <meta name="description" content="Practical guides on prompting techniques, RAG pipelines, LLM agents, and fine-tuning — from first principles to production.">
```

- [ ] **Step 2: Create posts/coming-soon.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coming Soon — introtoalgo</title>
  <meta name="description" content="This article is in progress. Check back soon.">
  <meta name="robots" content="noindex">
  <link rel="stylesheet" href="../assets/css/blog.css">

  <script async src="https://www.googletagmanager.com/gtag/js?id=UA-116936620-1"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'UA-116936620-1');
  </script>

  <style>
    .coming-soon {
      padding: 6rem 0 4rem;
      text-align: center;
      animation: fadeUp 0.5s ease both;
    }
    .coming-eyebrow {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 1.5rem;
    }
    .coming-title {
      font-family: var(--font-display);
      font-size: clamp(2rem, 6vw, 3rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text);
      margin-bottom: 1rem;
    }
    .coming-sub {
      font-size: 1rem;
      color: var(--text-mid);
      line-height: 1.6;
      max-width: 400px;
      margin: 0 auto 2.5rem;
    }
    .back-link {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-dim);
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      transition: color 0.2s, gap 0.2s;
    }
    .back-link::before { content: '←'; }
    .back-link:hover { color: var(--accent); gap: 0.8rem; }
  </style>
</head>
<body>

<div class="wrap">

  <div class="coming-soon">
    <div class="coming-eyebrow">in progress</div>
    <h1 class="coming-title">Article coming soon.</h1>
    <p class="coming-sub">This guide is being written. Check back shortly or browse other posts in the meantime.</p>
    <a href="../index.html" class="back-link">Back to Blog</a>
  </div>

  <footer class="site-footer">
    <span class="footer-text">&copy; introtoalgo</span>
    <span class="footer-text">By <a href="https://www.sarveshbhatnagar.com" target="_blank" rel="noopener">Sarvesh Bhatnagar</a></span>
  </footer>

</div>

<script src="../assets/js/navbar.js"></script>

</body>
</html>
```

- [ ] **Step 3: Verify in browser**

Open `index.html`. Confirm:
- Hero reads "Learn to build with AI."
- Eyebrow reads "artificial intelligence & large language models"
- Click "Read Article" on the featured post — it should load the coming-soon stub

Open `posts/coming-soon.html` directly and confirm the stub renders with nav and back link.

- [ ] **Step 4: Commit**

```bash
git add index.html posts/coming-soon.html
git commit -m "feat: rewrite homepage hero for AI/LLM focus, add coming-soon stub"
```

---

## Task 5: SEO on index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add canonical, Open Graph, Twitter, and JSON-LD to index.html `<head>`**

After the existing `<meta name="description">` line in `index.html`, insert:

```html
  <link rel="canonical" href="https://introtoalgo.com/">

  <!-- Open Graph -->
  <meta property="og:title" content="introtoalgo — AI &amp; LLM Practical Guides">
  <meta property="og:description" content="Practical guides on prompting techniques, RAG pipelines, LLM agents, and fine-tuning — from first principles to production.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://introtoalgo.com/">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="introtoalgo — AI &amp; LLM Practical Guides">
  <meta name="twitter:description" content="Practical guides on prompting techniques, RAG pipelines, LLM agents, and fine-tuning — from first principles to production.">

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "introtoalgo",
    "url": "https://introtoalgo.com",
    "description": "Practical guides on prompting techniques, RAG pipelines, LLM agents, and fine-tuning — from first principles to production.",
    "author": {
      "@type": "Person",
      "name": "Sarvesh Bhatnagar",
      "url": "https://www.sarveshbhatnagar.com"
    }
  }
  </script>
```

- [ ] **Step 2: Verify using browser DevTools**

Open `index.html` in browser. Open DevTools → Elements → `<head>`. Confirm all tags are present: canonical, og:title, og:type, twitter:card, and the JSON-LD script block.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "seo: add canonical, Open Graph, Twitter, JSON-LD to index.html"
```

---

## Task 6: SEO on algos.html, generic.html, category.html

**Files:**
- Modify: `algos.html`
- Modify: `generic.html`
- Modify: `category.html`

- [ ] **Step 1: Add SEO tags to algos.html**

After the existing `<meta name="description">` in `algos.html`, insert:

```html
  <link rel="canonical" href="https://introtoalgo.com/algos.html">

  <meta property="og:title" content="Algos — introtoalgo">
  <meta property="og:description" content="A collection of algorithm categories covered on introtoalgo.com.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://introtoalgo.com/algos.html">

  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Algos — introtoalgo">
  <meta name="twitter:description" content="A collection of algorithm categories covered on introtoalgo.com.">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Algos — introtoalgo",
    "url": "https://introtoalgo.com/algos.html",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://introtoalgo.com/" },
        { "@type": "ListItem", "position": 2, "name": "Algos", "item": "https://introtoalgo.com/algos.html" }
      ]
    }
  }
  </script>
```

- [ ] **Step 2: Add SEO tags to generic.html**

After the existing `<meta name="description">` in `generic.html`, insert:

```html
  <link rel="canonical" href="https://introtoalgo.com/generic.html">

  <meta property="og:title" content="About — Sarvesh Bhatnagar">
  <meta property="og:description" content="Sarvesh Bhatnagar — writer, coder, researcher, and founder.">
  <meta property="og:type" content="profile">
  <meta property="og:url" content="https://introtoalgo.com/generic.html">

  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="About — Sarvesh Bhatnagar">
  <meta name="twitter:description" content="Sarvesh Bhatnagar — writer, coder, researcher, and founder.">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "name": "About — Sarvesh Bhatnagar",
    "url": "https://introtoalgo.com/generic.html",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://introtoalgo.com/" },
        { "@type": "ListItem", "position": 2, "name": "About", "item": "https://introtoalgo.com/generic.html" }
      ]
    }
  }
  </script>
```

- [ ] **Step 3: Update category.html — exclude archived posts + add SEO**

In `category.html`, add a `<meta name="description">` and SEO tags. After `<title>Category — introtoalgo</title>`, add:

```html
  <meta name="description" content="Browse posts by category on introtoalgo.">
  <link rel="canonical" href="https://introtoalgo.com/category.html">

  <meta property="og:title" content="Category — introtoalgo">
  <meta property="og:description" content="Browse posts by category on introtoalgo.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://introtoalgo.com/category.html">

  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Category — introtoalgo">
  <meta name="twitter:description" content="Browse posts by category on introtoalgo.">
```

Also, in `category.html`'s inline script, find:

```javascript
  var filtered = tag ? POSTS.filter(function(p) { return p.tag === tag; }) : POSTS;
```

Replace with:

```javascript
  var active   = POSTS.filter(function(p) { return !p.archived; });
  var filtered = tag ? active.filter(function(p) { return p.tag === tag; }) : active;
```

- [ ] **Step 4: Verify**

Open `algos.html` and `generic.html` in browser, check DevTools `<head>` for canonical + OG tags.
Open `category.html?tag=Graph+Theory` — it should show 0 posts (archived filter working).

- [ ] **Step 5: Commit**

```bash
git add algos.html generic.html category.html
git commit -m "seo: add SEO tags to algos, generic, category; exclude archived posts from category filter"
```

---

## Task 7: SEO + semantic HTML on posts/mst.html

**Files:**
- Modify: `posts/mst.html`

- [ ] **Step 1: Add SEO tags to `<head>`**

After the existing `<meta name="description">` in `posts/mst.html`, insert:

```html
  <link rel="canonical" href="https://introtoalgo.com/posts/mst.html">

  <meta property="og:title" content="Minimum Spanning Tree — introtoalgo">
  <meta property="og:description" content="Minimum spanning tree spans all nodes at minimum aggregate cost. Learn Kruskal's algorithm and Union-Find.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://introtoalgo.com/posts/mst.html">
  <meta property="og:image" content="https://introtoalgo.com/images/mst.jpg">
  <meta property="article:published_time" content="2017-04-25">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Minimum Spanning Tree — introtoalgo">
  <meta name="twitter:description" content="Minimum spanning tree spans all nodes at minimum aggregate cost. Learn Kruskal's algorithm and Union-Find.">
  <meta name="twitter:image" content="https://introtoalgo.com/images/mst.jpg">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Minimum Spanning Tree",
    "datePublished": "2017-04-25",
    "author": { "@type": "Person", "name": "Sarvesh Bhatnagar", "url": "https://www.sarveshbhatnagar.com" },
    "publisher": { "@type": "Organization", "name": "introtoalgo", "url": "https://introtoalgo.com" },
    "url": "https://introtoalgo.com/posts/mst.html",
    "image": "https://introtoalgo.com/images/mst.jpg",
    "description": "Minimum spanning tree spans all nodes at minimum aggregate cost. Learn Kruskal's algorithm and Union-Find."
  }
  </script>
```

- [ ] **Step 2: Update `<span class="post-date">` to `<time>` element**

Find:

```html
      <span class="post-date">April 25, 2017</span>
```

Replace with:

```html
      <time class="post-date" datetime="2017-04-25">April 25, 2017</time>
```

- [ ] **Step 3: Wrap post content in `<article>`**

Find:

```html
  <header class="post-header">
```

Insert `<article>` before it:

```html
  <article>
  <header class="post-header">
```

Find the closing tag of `<main class="post-body">` (just before `<footer class="site-footer">`):

```html
  </main>

  <footer class="site-footer">
```

Replace with:

```html
  </main>
  </article>

  <footer class="site-footer">
```

- [ ] **Step 4: Verify**

Open `posts/mst.html`. Check DevTools `<head>` for canonical, og:type="article", JSON-LD. Inspect Elements panel and confirm `<article>` wraps the post content and `<time datetime="2017-04-25">` is present.

- [ ] **Step 5: Commit**

```bash
git add posts/mst.html
git commit -m "seo: add SEO tags + semantic HTML to mst.html"
```

---

## Task 8: SEO + semantic HTML on posts/communitydetection.html

**Files:**
- Modify: `posts/communitydetection.html`

- [ ] **Step 1: Add SEO tags to `<head>`**

After the existing `<meta name="description">` in `posts/communitydetection.html`, insert:

```html
  <link rel="canonical" href="https://introtoalgo.com/posts/communitydetection.html">

  <meta property="og:title" content="Community Detection: Introduction — introtoalgo">
  <meta property="og:description" content="Community detection finds densely intra-connected and sparsely inter-connected clusters in networks.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://introtoalgo.com/posts/communitydetection.html">
  <meta property="og:image" content="https://introtoalgo.com/images/communitydetection.jpg">
  <meta property="article:published_time" content="2017-04-24">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Community Detection: Introduction — introtoalgo">
  <meta name="twitter:description" content="Community detection finds densely intra-connected and sparsely inter-connected clusters in networks.">
  <meta name="twitter:image" content="https://introtoalgo.com/images/communitydetection.jpg">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Community Detection: Introduction",
    "datePublished": "2017-04-24",
    "author": { "@type": "Person", "name": "Sarvesh Bhatnagar", "url": "https://www.sarveshbhatnagar.com" },
    "publisher": { "@type": "Organization", "name": "introtoalgo", "url": "https://introtoalgo.com" },
    "url": "https://introtoalgo.com/posts/communitydetection.html",
    "image": "https://introtoalgo.com/images/communitydetection.jpg",
    "description": "Community detection finds densely intra-connected and sparsely inter-connected clusters in networks."
  }
  </script>
```

- [ ] **Step 2: Update `<span class="post-date">` to `<time>`**

Find:

```html
      <span class="post-date">April 24, 2017</span>
```

Replace with:

```html
      <time class="post-date" datetime="2017-04-24">April 24, 2017</time>
```

- [ ] **Step 3: Wrap post content in `<article>`**

Find `<header class="post-header">` and insert `<article>` before it.
Find `</main>` followed by `<footer class="site-footer">` and insert `</article>` between them.

```html
  </main>
  </article>

  <footer class="site-footer">
```

- [ ] **Step 4: Verify + commit**

Open `posts/communitydetection.html`, verify OG tags and `<article>` wrapper in DevTools.

```bash
git add posts/communitydetection.html
git commit -m "seo: add SEO tags + semantic HTML to communitydetection.html"
```

---

## Task 9: SEO + semantic HTML on posts/semanticnetworks.html

**Files:**
- Modify: `posts/semanticnetworks.html`

- [ ] **Step 1: Add SEO tags to `<head>`**

After the existing `<meta name="description">`, insert:

```html
  <link rel="canonical" href="https://introtoalgo.com/posts/semanticnetworks.html">

  <meta property="og:title" content="Semantic Networks: Basics — introtoalgo">
  <meta property="og:description" content="Semantic networks are graphical representations of interconnections between nodes, used for knowledge representation in AI.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://introtoalgo.com/posts/semanticnetworks.html">
  <meta property="og:image" content="https://introtoalgo.com/images/semanticnets.jpg">
  <meta property="article:published_time" content="2017-04-22">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Semantic Networks: Basics — introtoalgo">
  <meta name="twitter:description" content="Semantic networks are graphical representations of interconnections between nodes, used for knowledge representation in AI.">
  <meta name="twitter:image" content="https://introtoalgo.com/images/semanticnets.jpg">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Semantic Networks: Basics",
    "datePublished": "2017-04-22",
    "author": { "@type": "Person", "name": "Sarvesh Bhatnagar", "url": "https://www.sarveshbhatnagar.com" },
    "publisher": { "@type": "Organization", "name": "introtoalgo", "url": "https://introtoalgo.com" },
    "url": "https://introtoalgo.com/posts/semanticnetworks.html",
    "image": "https://introtoalgo.com/images/semanticnets.jpg",
    "description": "Semantic networks are graphical representations of interconnections between nodes, used for knowledge representation in AI."
  }
  </script>
```

- [ ] **Step 2: Update `<span class="post-date">` to `<time>`**

Find:

```html
      <span class="post-date">April 22, 2017</span>
```

Replace with:

```html
      <time class="post-date" datetime="2017-04-22">April 22, 2017</time>
```

- [ ] **Step 3: Wrap post content in `<article>`**

Insert `<article>` before `<header class="post-header">`.
Insert `</article>` between `</main>` and `<footer class="site-footer">`.

- [ ] **Step 4: Verify + commit**

```bash
git add posts/semanticnetworks.html
git commit -m "seo: add SEO tags + semantic HTML to semanticnetworks.html"
```

---

## Task 10: SEO + semantic HTML on posts/networktheory.html

**Files:**
- Modify: `posts/networktheory.html`

- [ ] **Step 1: Add SEO tags to `<head>`**

After the existing `<meta name="description">`, insert:

```html
  <link rel="canonical" href="https://introtoalgo.com/posts/networktheory.html">

  <meta property="og:title" content="Network Theory (Graph Theory) — introtoalgo">
  <meta property="og:description" content="Network theory studies graphs as representations of symmetric or asymmetric relations between discrete objects.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://introtoalgo.com/posts/networktheory.html">
  <meta property="og:image" content="https://introtoalgo.com/images/graphtheory.jpg">
  <meta property="article:published_time" content="2017-04-18">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Network Theory (Graph Theory) — introtoalgo">
  <meta name="twitter:description" content="Network theory studies graphs as representations of symmetric or asymmetric relations between discrete objects.">
  <meta name="twitter:image" content="https://introtoalgo.com/images/graphtheory.jpg">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Network Theory (Graph Theory)",
    "datePublished": "2017-04-18",
    "author": { "@type": "Person", "name": "Sarvesh Bhatnagar", "url": "https://www.sarveshbhatnagar.com" },
    "publisher": { "@type": "Organization", "name": "introtoalgo", "url": "https://introtoalgo.com" },
    "url": "https://introtoalgo.com/posts/networktheory.html",
    "image": "https://introtoalgo.com/images/graphtheory.jpg",
    "description": "Network theory studies graphs as representations of symmetric or asymmetric relations between discrete objects."
  }
  </script>
```

- [ ] **Step 2: Update `<span class="post-date">` to `<time>`**

Find:

```html
      <span class="post-date">April 18, 2017</span>
```

Replace with:

```html
      <time class="post-date" datetime="2017-04-18">April 18, 2017</time>
```

- [ ] **Step 3: Wrap post content in `<article>`**

Insert `<article>` before `<header class="post-header">`.
Insert `</article>` between `</main>` and `<footer class="site-footer">`.

- [ ] **Step 4: Verify + commit**

```bash
git add posts/networktheory.html
git commit -m "seo: add SEO tags + semantic HTML to networktheory.html"
```

---

## Task 11: SEO + semantic HTML on posts/markovchains.html

**Files:**
- Modify: `posts/markovchains.html`

- [ ] **Step 1: Add SEO tags to `<head>`**

After the existing `<meta name="description">`, insert:

```html
  <link rel="canonical" href="https://introtoalgo.com/posts/markovchains.html">

  <meta property="og:title" content="Markov Chains: Basics — introtoalgo">
  <meta property="og:description" content="Markov chains model sequences of events where the next state depends only on the current state. Learn transition matrices and applications.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://introtoalgo.com/posts/markovchains.html">
  <meta property="og:image" content="https://introtoalgo.com/images/markovchain.png">
  <meta property="article:published_time" content="2017-04-14">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Markov Chains: Basics — introtoalgo">
  <meta name="twitter:description" content="Markov chains model sequences of events where the next state depends only on the current state.">
  <meta name="twitter:image" content="https://introtoalgo.com/images/markovchain.png">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Markov Chains: Basics",
    "datePublished": "2017-04-14",
    "author": { "@type": "Person", "name": "Sarvesh Bhatnagar", "url": "https://www.sarveshbhatnagar.com" },
    "publisher": { "@type": "Organization", "name": "introtoalgo", "url": "https://introtoalgo.com" },
    "url": "https://introtoalgo.com/posts/markovchains.html",
    "image": "https://introtoalgo.com/images/markovchain.png",
    "description": "Markov chains model sequences of events where the next state depends only on the current state. Learn transition matrices and applications."
  }
  </script>
```

- [ ] **Step 2: Update `<span class="post-date">` to `<time>`**

Find:

```html
      <span class="post-date">April 14, 2017</span>
```

Replace with:

```html
      <time class="post-date" datetime="2017-04-14">April 14, 2017</time>
```

- [ ] **Step 3: Wrap post content in `<article>`**

Insert `<article>` before `<header class="post-header">`.
Insert `</article>` between `</main>` and `<footer class="site-footer">`.

- [ ] **Step 4: Verify + commit**

```bash
git add posts/markovchains.html
git commit -m "seo: add SEO tags + semantic HTML to markovchains.html"
```

---

## Task 12: SEO + semantic HTML on posts/speedinguplinkedlist.html

**Files:**
- Modify: `posts/speedinguplinkedlist.html`

- [ ] **Step 1: Add SEO tags to `<head>`**

After the existing `<meta name="description">`, insert:

```html
  <link rel="canonical" href="https://introtoalgo.com/posts/speedinguplinkedlist.html">

  <meta property="og:title" content="Speeding Up Linked Lists — introtoalgo">
  <meta property="og:description" content="Techniques for improving search speed in singly linked lists using indexing methods.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://introtoalgo.com/posts/speedinguplinkedlist.html">
  <meta property="og:image" content="https://introtoalgo.com/images/speedlinked.jpg">
  <meta property="article:published_time" content="2017-04-11">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Speeding Up Linked Lists — introtoalgo">
  <meta name="twitter:description" content="Techniques for improving search speed in singly linked lists using indexing methods.">
  <meta name="twitter:image" content="https://introtoalgo.com/images/speedlinked.jpg">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Speeding Up Linked Lists",
    "datePublished": "2017-04-11",
    "author": { "@type": "Person", "name": "Sarvesh Bhatnagar", "url": "https://www.sarveshbhatnagar.com" },
    "publisher": { "@type": "Organization", "name": "introtoalgo", "url": "https://introtoalgo.com" },
    "url": "https://introtoalgo.com/posts/speedinguplinkedlist.html",
    "image": "https://introtoalgo.com/images/speedlinked.jpg",
    "description": "Techniques for improving search speed in singly linked lists using indexing methods."
  }
  </script>
```

- [ ] **Step 2: Update `<span class="post-date">` to `<time>`**

Find:

```html
      <span class="post-date">April 11, 2017</span>
```

Replace with:

```html
      <time class="post-date" datetime="2017-04-11">April 11, 2017</time>
```

- [ ] **Step 3: Wrap post content in `<article>`**

Insert `<article>` before `<header class="post-header">`.
Insert `</article>` between `</main>` and `<footer class="site-footer">`.

- [ ] **Step 4: Verify + commit**

```bash
git add posts/speedinguplinkedlist.html
git commit -m "seo: add SEO tags + semantic HTML to speedinguplinkedlist.html"
```

---

## Task 13: SEO + semantic HTML on posts/mergesort.html

**Files:**
- Modify: `posts/mergesort.html`

- [ ] **Step 1: Add SEO tags to `<head>`**

After the existing `<meta name="description">`, insert:

```html
  <link rel="canonical" href="https://introtoalgo.com/posts/mergesort.html">

  <meta property="og:title" content="Merge Sort — introtoalgo">
  <meta property="og:description" content="Merge sort is a divide-and-conquer sorting algorithm. Learn the algorithm, pseudocode, and C++ implementation.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://introtoalgo.com/posts/mergesort.html">
  <meta property="og:image" content="https://introtoalgo.com/images/mergesort.png">
  <meta property="article:published_time" content="2017-04-07">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Merge Sort — introtoalgo">
  <meta name="twitter:description" content="Merge sort is a divide-and-conquer sorting algorithm. Learn the algorithm, pseudocode, and C++ implementation.">
  <meta name="twitter:image" content="https://introtoalgo.com/images/mergesort.png">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Merge Sort",
    "datePublished": "2017-04-07",
    "author": { "@type": "Person", "name": "Sarvesh Bhatnagar", "url": "https://www.sarveshbhatnagar.com" },
    "publisher": { "@type": "Organization", "name": "introtoalgo", "url": "https://introtoalgo.com" },
    "url": "https://introtoalgo.com/posts/mergesort.html",
    "image": "https://introtoalgo.com/images/mergesort.png",
    "description": "Merge sort is a divide-and-conquer sorting algorithm. Learn the algorithm, pseudocode, and C++ implementation."
  }
  </script>
```

- [ ] **Step 2: Update `<span class="post-date">` to `<time>`**

Find:

```html
      <span class="post-date">April 7, 2017</span>
```

Replace with:

```html
      <time class="post-date" datetime="2017-04-07">April 7, 2017</time>
```

- [ ] **Step 3: Wrap post content in `<article>`**

Insert `<article>` before `<header class="post-header">`.
Insert `</article>` between `</main>` and `<footer class="site-footer">`.

- [ ] **Step 4: Verify + commit**

```bash
git add posts/mergesort.html
git commit -m "seo: add SEO tags + semantic HTML to mergesort.html"
```

---

## Task 14: Create sitemap.xml + robots.txt

**Files:**
- Create: `sitemap.xml`
- Create: `robots.txt`

- [ ] **Step 1: Create `sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Core pages -->
  <url>
    <loc>https://introtoalgo.com/</loc>
    <lastmod>2026-04-13</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://introtoalgo.com/archive.html</loc>
    <lastmod>2026-04-13</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://introtoalgo.com/algos.html</loc>
    <lastmod>2026-04-13</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://introtoalgo.com/generic.html</loc>
    <lastmod>2026-04-13</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- Legacy posts (preserved for SEO equity) -->
  <url>
    <loc>https://introtoalgo.com/posts/mst.html</loc>
    <lastmod>2017-04-25</lastmod>
    <changefreq>never</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://introtoalgo.com/posts/communitydetection.html</loc>
    <lastmod>2017-04-24</lastmod>
    <changefreq>never</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://introtoalgo.com/posts/semanticnetworks.html</loc>
    <lastmod>2017-04-22</lastmod>
    <changefreq>never</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://introtoalgo.com/posts/networktheory.html</loc>
    <lastmod>2017-04-18</lastmod>
    <changefreq>never</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://introtoalgo.com/posts/markovchains.html</loc>
    <lastmod>2017-04-14</lastmod>
    <changefreq>never</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://introtoalgo.com/posts/speedinguplinkedlist.html</loc>
    <lastmod>2017-04-11</lastmod>
    <changefreq>never</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://introtoalgo.com/posts/mergesort.html</loc>
    <lastmod>2017-04-07</lastmod>
    <changefreq>never</changefreq>
    <priority>0.8</priority>
  </url>

</urlset>
```

- [ ] **Step 2: Create `robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://introtoalgo.com/sitemap.xml
```

- [ ] **Step 3: Verify sitemap is valid XML**

Open `sitemap.xml` in a browser (file:// is fine). It should render as XML with no parse errors — the browser will show the tree structure cleanly. If it shows a blank page or error, check for unclosed tags.

- [ ] **Step 4: Commit**

```bash
git add sitemap.xml robots.txt
git commit -m "seo: add sitemap.xml and robots.txt"
```
