// Page shell shared by every generated page: head, header, footer.
import { esc, SITE } from './util.mjs';
import { icon } from './components.mjs';

// Kept byte-for-byte from the original site: Google Analytics + AdSense.
export const ANALYTICS = `  <script async src="https://www.googletagmanager.com/gtag/js?id=G-H1004XLX3E"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-H1004XLX3E');
  </script>
  <script data-ad-client="ca-pub-8611389211624701" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>`;

const FONTS = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=JetBrains+Mono:wght@400;500;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..500&display=swap';

// Runs before first paint: applies saved theme + code language, marks JS on.
const BOOT = `<script>(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('ia:theme');if(t==='light'||t==='dark')d.setAttribute('data-theme',t);var l=localStorage.getItem('ia:lang');if(l==='py'||l==='js')d.setAttribute('data-lang',l);}catch(e){}})();</script>`;

const NAV = [
  { id: 'algorithms', href: '/algorithms/', label: 'Algorithms', icon: 'graph' },
  { id: 'practice', href: '/practice/', label: 'Practice', icon: 'code' },
  { id: 'ai', href: '/ai/', label: 'AI', icon: 'brain' },
];

export function header(active) {
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="site-header__inner">
    <a class="logo" href="/" aria-label="introtoalgo home"><span class="logo__prompt" aria-hidden="true">&gt;_</span><span class="logo__name">introtoalgo</span></a>
    <nav class="site-nav" aria-label="Main">
      ${NAV.map((n) => `<a href="${n.href}" class="site-nav__link site-nav__link--${n.id}"${active === n.id ? ' aria-current="page"' : ''}>${n.label}</a>`).join('\n      ')}
    </nav>
    <button type="button" class="theme-toggle" data-theme-toggle aria-label="Switch to dark theme" title="Switch theme">${icon('sun', 'icon theme-toggle__sun')}${icon('moon', 'icon theme-toggle__moon')}</button>
  </div>
</header>`;
}

export function footer() {
  return `<footer class="site-footer">
  <div class="site-footer__inner">
    <div class="site-footer__brand">
      <a class="logo logo--small" href="/"><span class="logo__prompt" aria-hidden="true">&gt;_</span>introtoalgo</a>
      <p>Free lessons and practice for algorithms and AI. Your progress stays in this browser.</p>
    </div>
    <nav class="site-footer__nav" aria-label="Footer">
      <div><h2>Learn</h2><a href="/algorithms/">Algorithms</a><a href="/practice/">Practice</a><a href="/ai/">AI</a></div>
      <div><h2>Site</h2><a href="/archive.html">Archive</a><a href="/about.html">About</a><a href="/sitemap.xml">Sitemap</a></div>
    </nav>
  </div>
  <div class="site-footer__base"><span>&copy; introtoalgo</span><span>By <a href="https://www.sarveshbhatnagar.com" target="_blank" rel="noopener">Sarvesh Bhatnagar</a></span></div>
</footer>`;
}

/**
 * opts: title, fullTitle, description, path, track (algorithms|practice|ai|home|other),
 * main (HTML), scripts (module paths), jsonLd (object), ogType, bodyClass, wide
 */
export function page(opts) {
  const {
    title, fullTitle, description = '', path, track = 'home', main, scripts = [], jsonLd, ogType = 'website',
    bodyClass = '', noindex = false, extraHead = '', canonical = true,
  } = opts;
  const t = fullTitle || `${title} | introtoalgo`;
  const url = SITE + path;
  const ld = jsonLd ? `\n  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : '';
  return `<!DOCTYPE html>
<html lang="en" data-track="${track}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(t)}</title>
  <meta name="description" content="${esc(description)}">
  ${canonical ? `<link rel="canonical" href="${url}">` : ''}${noindex ? '\n  <meta name="robots" content="noindex">' : ''}
  <meta property="og:title" content="${esc(t)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="introtoalgo">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(t)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="theme-color" content="#f6f5f0" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0e0f0c" media="(prefers-color-scheme: dark)">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  ${BOOT}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS}">
  <link rel="stylesheet" href="/assets/css/site.css">${ld}
${ANALYTICS}${extraHead ? '\n  ' + extraHead : ''}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${header(track)}
<main id="main" tabindex="-1">
${main}
</main>
${footer()}
<script type="module" src="/assets/js/site.js"></script>
${scripts.map((s) => `<script type="module" src="${s}"></script>`).join('\n')}
</body>
</html>
`;
}

export function redirectPage(to, label) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Moved: ${esc(label)} | introtoalgo</title>
  <link rel="canonical" href="${SITE}${to}">
  <meta http-equiv="refresh" content="0; url=${to}">
  <meta name="robots" content="noindex">
${ANALYTICS}
</head>
<body>
  <p>This page has moved to <a href="${to}">${esc(label)}</a>.</p>
</body>
</html>
`;
}

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: SITE + it.path })),
  };
}
