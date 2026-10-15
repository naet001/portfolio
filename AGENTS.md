# AGENTS.md

## Overview

Single-page static portfolio site for **Nommoh Hayab (backend engineer)**. Plain HTML +
Tailwind CSS utility classes, with a small amount of hand-written CSS in `css/input.css`
for base resets, focus rings, and texture layers. No framework, no bundler, no client-side
router — the whole site is one HTML file plus a tiny vanilla-JS enhancement.

The visual identity is a strict **Minimalist Monochrome** system (black/white, oversized
serif display type, hairline/border rules, zero border radius, ≤100ms interactions). The
full design system lives one level up in `../STYLE.md` — read it before changing anything
visual. Treat its "Bold Choices (Non-Negotiable)" section as binding.

## Layout

```
portfolio/
├── index.html            # The entire site. All markup lives here.
├── css/
│   ├── input.css         # Source CSS: @tailwind directives + global non-utility styles
│   └── main.css          # GENERATED build output — do not edit by hand
├── js/main.js            # Vanilla JS: theme toggle + mobile nav (separate IIFEs)
├── images/               # Unused stock assets (not currently referenced in markup)
├── tailwind.config.js    # Token aliases (font/width) + CSS-variable color channels
├── package.json          # Tailwind CLI only
└── .gitignore
```

The git repo root is this `portfolio/` directory. Commit messages are conventional-commit
style: a short subject, then a `-` bullet list of what changed and why.

## Commands

```bash
npm install          # install tailwindcss 3.4 (devDependency)
npm run build        # tailwindcss -i ./css/input.css -o ./css/main.css --minify
npm run dev          # same, with --watch
```

- Serve locally with any static server, e.g. `python3 -m http.server 8000`, then open
  `/index.html`. Opening the file directly works too (no modules, no fetch).
- **After changing classes in `index.html` or rules in `css/input.css`, run `npm run build`**
  (or leave `npm run dev` running) and commit the regenerated `css/main.css` — it is
  tracked, and the live site loads it directly.
- There is **no test suite, linter, or formatter**. Don't invent one; verify visually.

## Deploy (Vercel)

- Production is **Vercel**, connected to `origin/main`. `vercel.json` is the source of truth:
  `framework: null`, `installCommand: npm install`, `buildCommand: npm run build`,
  `outputDirectory: "."`, plus cache and security headers.
- Vercel **rebuilds `css/main.css` from `css/input.css` on every deploy**, so the tracked
  copy can never drift in production. It is still committed so local `file://` previews and
  GitHub Pages work.
- `.vercelignore` keeps `AGENTS.md` and `README.md` out of the upload. **Never add
  `package.json`, `package-lock.json`, `css/input.css`, or `tailwind.config.js` to it** —
  the remote build needs all four to compile the CSS.
- Because `outputDirectory` is the repo root, Vercel serves the working tree directly. Do not
  introduce root-absolute paths (`/css/main.css`); all asset references stay relative so the
  site works at any host and path.

## Conventions

**Tailwind**
- Content scan path is `./index.html` only. New classes in `js/` or `css/input.css` will be
  purged unless you add the file to `content` in `tailwind.config.js`.
- Tokens are defined once in `tailwind.config.js` and must be used instead of raw hex values.
  They are **CSS-variable-backed channel triplets** (`rgb(var(--color-ink) / <alpha-value>)`), not
  raw hex — that's what keeps the `text-ink/70` opacity modifiers working.
  - colors: `ink`, `paper`, `muted`, `line` — the actual RGB channel values live in
    `css/input.css` (`:root` = light, `[data-theme='dark']` = dark), **not** in the config.
  - fonts: `font-serif` (Instrument Serif — display/headings, **400 only, never `font-bold`**),
    `font-body` (DM Sans — body, set on `<body>`), `font-mono` (IBM Plex Mono — labels, dates,
    metadata), `font-sans` (DM Sans). The full mapping lives in `../FONTS.md`.
  - layout: `max-w-site` (72rem) is the container; `px-6 md:px-10` is the gutter
- Opacity modifiers on the tokens (`text-ink/70`, `bg-paper/90`) are the accepted way to get
  secondary tones instead of introducing new grays.

**Theme (dark/light)**
- The palette stays strictly two-color. Dark mode is a pure inversion: `ink` and `paper` swap,
  and `muted`/`line` move to their inverse weights. **Never introduce a third color or a
  `dark:` variant class** — add a token instead. Dark mode must be expressible as an inversion.
- `js/main.js` owns the toggle; an inline `<script>` in `<head>` of `index.html` sets
  `data-theme` on `<html>` *before first paint* (do not move it below the stylesheet link, or
  the page flashes the wrong theme). With no stored choice it follows
  `prefers-color-scheme`; an explicit toggle is stored in `localStorage.theme` and then wins.
- In `css/input.css`, never hardcode `#000`/`#fff` — use `rgb(var(--color-ink))` /
  `rgb(var(--color-paper))`. This includes textures, focus rings, the hero overlay, and
  `.square-motif`. The contact/footer blocks use the *paper* token for their texture and focus
  ring because they carry `bg-ink text-paper` and therefore invert with the page.
- There is no global texture layer. The grain (feTurbulence noise) and the ruled-line
  pattern were both removed; sections are flat. Photo legibility washes are the only overlays.
- Sections with `bg-ink text-paper` (contact, footer) intentionally become **light** blocks on
  the dark page. That's the design working, not a bug — do not "fix" it with dark: overrides.
- The 200ms cross-fade is scoped to a temporary `data-theme-switch` attribute added by JS, so
  it doesn't lengthen the site's normal 100–150ms hover transitions. It's explicitly disabled
  under `prefers-reduced-motion`.
- Verify theme work by checking *both* themes in a browser; there is no test suite.

**HTML**
- One `<section>` per page block, each `id`-linked from the nav with `scroll-mt-16` for the
  fixed header. Sections are separated by `border-b-[4px] border-ink`.
- Comment banners (`<!-- ===== SECTION NAME ===== -->`) delimit major blocks — keep them.
- Layout is a 12-column `md:grid-cols-12` grid with `col-span` / `col-start-*` placement.
- Content width lives on a `max-w-site mx-auto px-6 md:px-10` wrapper inside each section.

**Typography**
- Micro-labels, indices, years, and tech tags are `font-mono text-[0.7rem] uppercase
  tracking-[0.2em] text-muted`. Keep this exact treatment consistent.
- Headlines are `font-serif tracking-tight` with viewport-based sizes
  (`text-[13vw] md:text-[9rem]`). No `font-bold` — Instrument Serif ships 400 only.
- Body copy is `text-ink/80`, `leading-relaxed`.

**Interaction**
- Hover states are **left-to-right fill sweeps**, not instant inversions: `sweep-ink hover:text-paper` on paper surfaces (nav links, project rows, CV/email buttons), `sweep-paper hover:text-ink` on ink surfaces (contact CTA, social links, solid-ink buttons). The `::before` fill wipes in via scaleX over 260ms; the text flips on hover and `:focus-visible` with a 60ms delay so mid-wipe contrast holds. Keep `border` + base `bg-*` — the sweep covers them. Use `group` + `group-hover:`/`group-focus:` for per-child changes in a row.
- Transitions: color flips are 150ms (60ms delayed on sweeps); the sweep fill itself is 260ms ease-out. Nothing slower.
- Zero `rounded-*`. No shadows. No gradients. No accent colors.

**Accessibility**
- The skip link and `:focus-visible` outline (3px, 3px offset, inverted on dark sections)
  must survive changes.
- Interactive targets are ≥44px on touch; the mobile menu button keeps `min-h/min-w-[44px]`
  and is wired to `aria-expanded` / `aria-controls`.
- Keep `prefers-reduced-motion` intact when adding motion.
- Decorative elements get `aria-hidden="true"`.

**JS**
- `js/main.js` uses plain ES5-in-IIFE with defensive `if (!el) return;` guards and no
  dependencies. Keep it that way; match the existing style rather than modernizing.

## Gotchas

- `css/main.css` is committed build output — never hand-edit it; edit `css/input.css`.
- `images/` is mostly referenced, but not entirely. `css/input.css` uses
  `philip-oroni-VfOGf5RWkeg-unsplash.jpg` (hero + contact) and
  `milad-fakurian-XnkLo3xc960-unsplash.jpg`; `istockphoto-2187983015-1024x1024.jpg` is
  referenced by nothing. Grep `url(` in `css/input.css` before assuming an asset is in use.
- Site copy is **real**, sourced from `public/Isaac-Hayab-CV-1.pdf`. The CV is the source of
  truth for the hero, About, projects, and experience sections — when it changes, update
  `index.html` and re-render `og.png`. Replace strings only; do not restructure the markup.
- Identity facts are verified, not inferred. Email is `hnommoh@gmail.com` and the GitHub handle
  is `naet001` (confirmed by the user). The CV prints `naiih001` and
  `naiih001.github.io` — those are **typos in the CV**, not the site. Don't "fix" the site to
  match them.
- The canonical origin `https://nommoh-hayab.vercel.app/` is duplicated across `index.html`
  (canonical, `og:url`, JSON-LD `url`/`@id`), `robots.txt`, and `sitemap.xml`. If the domain
  changes, update all of them together — a stale canonical is worse than none.
- The social card is `og.png` at the repo root, rendered from `og/card.html` with headless
  Chromium. Edit the HTML, re-render, and commit the PNG together — the metadata points at the
  absolute URL `https://nommoh-hayab.vercel.app/og.png`, and `og/image:width` and
  `og:image:height` must stay 1200x630 to match. `og/` itself is in `.vercelignore`.
- The `card.html` body sets an explicit `height: 630px`; it needs `box-sizing: border-box` or
  the padding pushes the footer row out of frame.
- `favicon.svg` draws its letterforms as geometry with a `fill=` presentation-attribute fallback,
  so it still renders if a browser strips the `<style>` block. Keep both.