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

// Retract the section bar after the hero while keeping the banner available.
(function () {
  var header = document.getElementById('top');
  var hero = document.getElementById('hero');
  if (!header || !hero) return;

  function update() {
    var past = window.pageYOffset >= hero.offsetHeight - header.offsetHeight;
    header.classList.toggle('is-retracted', past);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// rem recordings: an auto-advancing ledger slider.
//
// Three rules hold the whole thing together.
//   * No clip has a src in the HTML. The codec is chosen once, and a slide only
//     receives a src while the band is on screen — so a visitor who never scrolls
//     to Projects downloads zero video bytes.
//   * Rotation runs only while nothing is holding it: a pause press, a pointer
//     over the band, focus inside it, a hidden tab, the band off screen, or a
//     slide that has been clicked open as a player.
//   * A programmatic scroll fires a burst of scroll events. The visible index is
//     resolved from the real scrollLeft only once the track has settled, so a
//     hand on the track always wins over the animation.
(function () {
  var region = document.querySelector('.demo');
  if (!region) return;

  var track = region.querySelector('.demo__track');
  var slides = [].slice.call(region.querySelectorAll('.demo__slide'));
  var pos = region.querySelector('.demo__pos');
  var fill = region.querySelector('.demo__progress-fill');
  var status = region.querySelector('[role="status"]');
  var toggle = region.querySelector('[data-demo="toggle"]');
  var prevBtn = region.querySelector('[data-demo="prev"]');
  var nextBtn = region.querySelector('[data-demo="next"]');
  if (!track || slides.length < 2) return;

  var total = slides.length;
  var media = window.matchMedia('(prefers-reduced-motion: reduce)');
  var codec = pickCodec();

  var index = 0;
  var userPaused = media.matches;
  var hover = false;
  var focusInside = false;
  var pageHidden = document.hidden === true;
  // Assume off-screen until the observer says otherwise, so the opening
  // prepare() below cannot start a download for a section nobody has reached.
  var offView = 'IntersectionObserver' in window;
  var playerMode = false;
  var programmatic = false;
  var timer = null;
  var settle = null;
  var startedAt = 0;
  var remaining = 0;

  function pickCodec() {
    var probe = document.createElement('video');
    function sure(type) {
      return probe.canPlayType(type) === 'probably';
    }
    if (sure('video/webm; codecs="vp9"')) return 'vp9';
    return 'mp4';
  }

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function videoAt(i) {
    return slides[i] ? slides[i].querySelector('.demo__video') : null;
  }

  function titleAt(i) {
    return slides[i].getAttribute('data-title') || 'Clip ' + (i + 1);
  }

  function rotationAllowed() {
    return !userPaused && !hover && !focusInside && !pageHidden && !offView && !playerMode;
  }

  // --- media ---------------------------------------------------------------

  function hydrate(i, preload) {
    var v = videoAt(i);
    var src = v && v.getAttribute('data-src-' + codec);
    if (!src) return;
    if (v.getAttribute('src') !== src) {
      v.setAttribute('src', src);
      v.load();
    }
    v.setAttribute('preload', preload);
  }

  function dehydrate(i) {
    var v = videoAt(i);
    if (!v || !v.getAttribute('src')) return;
    v.pause();
    v.removeAttribute('src');
    v.load();
  }

  function prepare() {
    var next = (index + 1) % total;
    for (var i = 0; i < total; i++) {
      if (offView) dehydrate(i);
      else if (i === index) hydrate(i, 'auto');
      else if (i === next) hydrate(i, 'metadata');
      else dehydrate(i);
    }
  }

  function play(i) {
    var v = videoAt(i);
    if (!v || v.paused === false) return;
    var attempt = v.play();
    if (attempt && attempt.catch) attempt.catch(function () { /* interrupted by a re-scroll */ });
  }

  // Each recording opens on dead desktop, so the slide names the second where
  // something is actually happening and the rotation starts there.
  function seek(i) {
    var v = videoAt(i);
    var at = parseFloat(slides[i].getAttribute('data-start'));
    if (!v || isNaN(at)) return;
    if (v.readyState < 1) return;
    try { v.currentTime = at; } catch (e) { /* not seekable yet */ }
  }

  // --- dwell ---------------------------------------------------------------

  function dwellAt(i) {
    var want = parseFloat(slides[i].getAttribute('data-dwell')) || 12;
    var v = videoAt(i);
    var dur = v && isFinite(v.duration) ? v.duration : 0;
    return dur > 1 && dur - 0.5 < want ? dur - 0.5 : want;
  }

  function paintFill(progress) {
    if (!fill) return;
    fill.style.transition = 'none';
    fill.style.transform = 'scaleX(' + progress + ')';
  }

  function runDwell(seconds) {
    remaining = seconds;
    startedAt = Date.now();
    if (fill) {
      // Two frames: commit scaleX(0) untransitioned, then let it sweep.
      paintFill(0);
      window.requestAnimationFrame(function () {
        if (!fill || remaining <= 0) return;
        fill.style.transition = 'transform ' + remaining + 's linear';
        fill.style.transform = 'scaleX(1)';
      });
    }
    clearTimeout(timer);
    timer = setTimeout(function () { move(index + 1, false); }, seconds * 1000);
  }

  function holdDwell() {
    clearTimeout(timer);
    timer = null;
    if (!fill || !remaining) return;
    var gone = (Date.now() - startedAt) / 1000;
    var left = Math.max(0, remaining - gone);
    paintFill(Math.min(1, gone / remaining));
    remaining = left;
  }

  function refresh() {
    if (rotationAllowed()) {
      if (timer === null) runDwell(remaining > 0.5 ? remaining : dwellAt(index));
      play(index);
    } else {
      if (timer !== null) holdDwell();
      var v = videoAt(index);
      if (v && !playerMode && !v.paused) v.pause();
    }
  }

  // --- position ------------------------------------------------------------

  function indexFromScroll() {
    var width = track.clientWidth || 1;
    return Math.max(0, Math.min(total - 1, Math.round(track.scrollLeft / width)));
  }

  function mark(i) {
    for (var k = 0; k < total; k++) {
      var active = k === i;
      slides[k].setAttribute('aria-hidden', active ? 'false' : 'true');
      if ('inert' in HTMLElement.prototype) {
        if (active) slides[k].removeAttribute('inert');
        else slides[k].setAttribute('inert', '');
      }
    }
    if (pos) pos.textContent = pad(i + 1);
  }

  function commit(i, announce) {
    index = i;
    remaining = 0;
    mark(i);
    prepare();
    seek(i);
    if (announce && status) status.textContent = 'Slide ' + (i + 1) + ' of ' + total + ': ' + titleAt(i);
    refresh();
  }

  function move(i, announce) {
    var target = ((i % total) + total) % total;
    exitPlayer();
    if (target === index) {
      commit(target, announce);
      return;
    }
    programmatic = true;
    track.scrollTo({ left: target * track.clientWidth, behavior: userPaused ? 'auto' : 'smooth' });
    commit(target, announce);
  }

  // --- player mode ---------------------------------------------------------

  function enterPlayer(i) {
    if (playerMode && i === index) return;
    if (i !== index) move(i, true);
    playerMode = true;
    holdDwell();
    var v = videoAt(index);
    if (!v) return;
    v.setAttribute('controls', '');
    v.removeAttribute('tabindex');
    var attempt = v.play();
    if (attempt && attempt.catch) attempt.catch(function () { /* autoplay still allowed: muted */ });
  }

  function exitPlayer() {
    if (!playerMode) return;
    playerMode = false;
    var v = videoAt(index);
    if (v) {
      v.removeAttribute('controls');
      v.setAttribute('tabindex', '-1');
      v.pause();
      // Clicking the clip focused the video. Left in place, that focus reads as
      // "keyboard is inside the band" and the rotation would stay held forever
      // with nothing on screen to show why.
      if (document.activeElement === v) {
        v.blur();
        focusInside = false;
      }
    }
    remaining = 0;
  }

  // --- wiring --------------------------------------------------------------

  syncToggle();

  for (var s = 0; s < total; s++) {
    (function (i) {
      slides[i].addEventListener('click', function () {
        if (playerMode) return;
        enterPlayer(i);
      });
      var v = videoAt(i);
      if (v) {
        v.addEventListener('loadedmetadata', function () { if (i === index) { seek(i); refresh(); } });
        v.addEventListener('ended', function () { if (i === index && !playerMode) move(i + 1, false); });
      }
    })(s);
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { move(index - 1, true); });
  if (nextBtn) nextBtn.addEventListener('click', function () { move(index + 1, true); });
  if (toggle) {
    toggle.addEventListener('click', function () {
      userPaused = !userPaused;
      if (!userPaused) remaining = 0;
      syncToggle();
      refresh();
    });
  }

  track.addEventListener('scroll', function () {
    clearTimeout(settle);
    settle = setTimeout(function () {
      var seen = indexFromScroll();
      var wasProgrammatic = programmatic;
      programmatic = false;
      if (seen !== index) {
        exitPlayer();
        commit(seen, !wasProgrammatic);
      }
    }, 120);
  }, { passive: true });

  if ('onscrollend' in window) {
    track.addEventListener('scrollend', function () {
      clearTimeout(settle);
      var seen = indexFromScroll();
      programmatic = false;
      if (seen !== index) commit(seen, false);
    });
  }

  region.addEventListener('mouseenter', function () { hover = true; refresh(); });
  region.addEventListener('mouseleave', function () { hover = false; refresh(); });
  region.addEventListener('focusin', function () { focusInside = true; refresh(); });
  region.addEventListener('focusout', function () {
    if (!region.contains(document.activeElement)) { focusInside = false; refresh(); }
  });
  region.addEventListener('pointerdown', function () { hover = true; refresh(); });

  document.addEventListener('click', function (e) {
    if (playerMode && !region.contains(e.target)) { exitPlayer(); refresh(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && playerMode) { exitPlayer(); refresh(); }
  });

  region.addEventListener('keydown', function (e) {
    if (playerMode || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') move(index + 1, true);
    else if (e.key === 'ArrowLeft') move(index - 1, true);
    else if (e.key === 'Home') move(0, true);
    else if (e.key === 'End') move(total - 1, true);
    else return;
    e.preventDefault();
  });

  document.addEventListener('visibilitychange', function () {
    pageHidden = document.hidden;
    refresh();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      offView = !entries[entries.length - 1].isIntersecting;
      if (offView) holdDwell();
      prepare();
      refresh();
    }, { threshold: 0.35 }).observe(region);
  }

  var onMotionChange = function (e) {
    if (e.matches) { userPaused = true; syncToggle(); }
    refresh();
  };
  if (media.addEventListener) media.addEventListener('change', onMotionChange);
  else if (media.addListener) media.addListener(onMotionChange);

  mark(index);
  prepare();
  seek(index);
  refresh();

  function syncToggle() {
    if (!toggle) return;
    var pauseIcon = toggle.querySelector('.demo__icon-pause');
    var playIcon = toggle.querySelector('.demo__icon-play');
    var label = toggle.querySelector('.demo__btn-label');
    toggle.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
    toggle.setAttribute('aria-label', userPaused ? 'Resume automatic rotation' : 'Pause automatic rotation');
    if (label) label.textContent = userPaused ? 'Paused' : 'Auto';
    if (pauseIcon) pauseIcon.classList.toggle('hidden', userPaused);
    if (playIcon) playIcon.classList.toggle('hidden', !userPaused);
  }
})();
