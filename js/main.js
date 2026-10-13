/* ============================================================
   Minimalist Monochrome — progressive enhancement
   Plain ES5, no dependencies, defensive against missing nodes.
   Each concern is an isolated IIFE.
   ============================================================ */

// Theme
// The initial theme is applied by the inline bootstrap in index.html
// before first paint. This module owns everything after that: the
// toggle buttons (desktop header + mobile menu), persisting the
// choice, and keeping an untouched site in sync with OS-level
// changes made while the page is open.
(function () {
  var btns = document.querySelectorAll('.theme-toggle');
  if (!btns.length) return;

  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function store(theme) {
    try {
      window.localStorage.setItem('theme', theme);
    } catch (e) {
      /* Private mode or blocked storage — the choice just won't persist. */
    }
  }

  function syncButton(theme) {
    var toDark = theme === 'light';
    var label = 'Switch to ' + (toDark ? 'dark' : 'light') + ' theme';
    var text = theme === 'dark' ? 'Dark mode' : 'Light mode';
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var lightIcon = b.querySelector('.theme-icon-light');
      var darkIcon = b.querySelector('.theme-icon-dark');
      var labelText = b.querySelector('.theme-toggle-label');
      b.setAttribute('aria-label', label);
      if (labelText) labelText.textContent = text;
      if (lightIcon) lightIcon.classList.toggle('hidden', !toDark);
      if (darkIcon) darkIcon.classList.toggle('hidden', toDark);
    }
  }

  function apply(theme, animate) {
    if (animate) {
      // Temporary attribute drives a short cross-fade in input.css.
      root.setAttribute('data-theme-switch', '');
      window.setTimeout(function () {
        root.removeAttribute('data-theme-switch');
      }, 220);
    }
    root.setAttribute('data-theme', theme);
    syncButton(theme);
  }

  for (var j = 0; j < btns.length; j++) {
    btns[j].addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      apply(next, true);
      store(next);
    });
  }

  // Follow the OS only while the visitor hasn't chosen explicitly.
  var onSystemChange = function (e) {
    var stored = null;
    try {
      stored = window.localStorage.getItem('theme');
    } catch (err) {
      /* Ignore: treat as "no explicit choice". */
    }
    if (stored !== 'light' && stored !== 'dark') {
      apply(e.matches ? 'dark' : 'light', true);
    }
  };

  if (media.addEventListener) {
    media.addEventListener('change', onSystemChange);
  } else if (media.addListener) {
    media.addListener(onSystemChange);
  }

  // Keep the icon and label honest after a restore-from-back/forward nav.
  syncButton(current());
})();

// Mobile menu toggle
(function () {
  var btn = document.getElementById('menu-btn');
  var menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', function () {
    var open = menu.classList.toggle('hidden');
    btn.setAttribute('aria-expanded', String(!open));
  });

  // Close the menu when a link inside it is clicked
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

// Header: transparent over the hero, opaque once scrolled past it
(function () {
  var header = document.getElementById('top');
  var hero = document.getElementById('hero');
  if (!header || !hero) return;

  // Solid when the header (0..height in viewport) sits entirely
  // below the hero, i.e. it starts covering the section after it.
  function update() {
    var past = window.pageYOffset >= hero.offsetHeight - header.offsetHeight;
    header.classList.toggle('is-solid', past);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();