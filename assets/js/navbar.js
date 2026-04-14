/* ================================================================
   navbar.js — single source of truth for the site header & cursor
   Injected into every page. Edit here, changes everywhere.
================================================================ */
(function () {
  var path = window.location.pathname;
  var inSubdir = /\/posts\//.test(path);
  var root = inSubdir ? '../' : '';

  // Determine active nav item
  var isAlgos   = /algos\.html/.test(path);
  var isAbout   = /generic\.html/.test(path);
  var isCategory = /category\.html/.test(path);
  var isArchive = /archive\.html/.test(path);
  var isBlog    = !isAlgos && !isAbout && !isCategory && !isArchive;

  // Inject cursor dot into <body>
  var cursorEl = document.createElement('div');
  cursorEl.className = 'cursor';
  cursorEl.id = 'cursor';
  document.body.insertBefore(cursorEl, document.body.firstChild);

  // Build header HTML
  var headerHTML =
    '<header class="site-header">' +
      '<a href="' + root + 'index.html" class="logo">' +
        '<span class="logo-prompt">&gt;_</span>introtoalgo' +
      '</a>' +
      '<nav class="site-nav">' +
        '<a href="' + root + 'index.html"   class="nav-link' + (isBlog    ? ' active' : '') + '">Blog</a>'    +
        '<a href="' + root + 'algos.html"   class="nav-link' + (isAlgos   ? ' active' : '') + '">Algos</a>'   +
        '<a href="' + root + 'archive.html" class="nav-link' + (isArchive ? ' active' : '') + '">Archive</a>' +
        '<a href="' + root + 'generic.html" class="nav-link' + (isAbout   ? ' active' : '') + '">About</a>'   +
      '</nav>' +
    '</header>';

  // Inject header as first child of .wrap
  var wrap = document.querySelector('.wrap');
  if (wrap) {
    wrap.insertAdjacentHTML('afterbegin', headerHTML);
  }

  // Cursor behaviour (desktop only)
  if (window.matchMedia('(hover: hover)').matches) {
    var cur = document.getElementById('cursor');
    document.addEventListener('mousemove', function (e) {
      cur.style.left = e.clientX + 'px';
      cur.style.top  = e.clientY + 'px';
    });
    // Attach hover expansion to all links (including newly injected ones)
    function attachHover() {
      document.querySelectorAll('a, button').forEach(function (el) {
        el.addEventListener('mouseenter', function () { cur.classList.add('hover'); });
        el.addEventListener('mouseleave', function () { cur.classList.remove('hover'); });
      });
    }
    // Run after DOM is fully parsed
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachHover);
    } else {
      attachHover();
    }
  }
})();
