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
├── js/main.js            # Vanilla JS: mobile nav toggle (IIFE, ES5-style)
├── images/               # Unused stock assets (not currently referenced in markup)
├── tailwind.config.js    # Design tokens: colors, fonts, maxWidth
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

## Conventions

**Tailwind**
- Content scan path is `./index.html` only. New classes in `js/` or `css/input.css` will be
  purged unless you add the file to `content` in `tailwind.config.js`.
- Tokens are defined once in `tailwind.config.js` and must be used instead of raw hex values:
  - colors: `ink` (#000), `paper` (#FFF), `muted` (#525252), `line` (#E5E5E5)
  - fonts: `font-serif` (Playfair Display — display/headings), `font-body` (Source Serif 4 —
    body, set on `<body>`), `font-mono` (JetBrains Mono — labels, dates, metadata), `font-sans`
  - layout: `max-w-site` (72rem) is the container; `px-6 md:px-10` is the gutter
- Opacity modifiers on the tokens (`text-ink/70`, `bg-paper/90`) are the accepted way to get
  secondary tones instead of introducing new grays.

**HTML**
- One `<section>` per page block, each `id`-linked from the nav with `scroll-mt-16` for the
  fixed header. Sections are separated by `border-b-[4px] border-ink`.
- Comment banners (`<!-- ===== SECTION NAME ===== -->`) delimit major blocks — keep them.
- Layout is a 12-column `md:grid-cols-12` grid with `col-span` / `col-start-*` placement.
- Content width lives on a `max-w-site mx-auto px-6 md:px-10` wrapper inside each section.

**Typography**
- Micro-labels, indices, years, and tech tags are `font-mono text-[0.7rem] uppercase
  tracking-[0.2em] text-muted`. Keep this exact treatment consistent.
- Headlines are `font-serif font-bold tracking-tight` with viewport-based sizes
  (`text-[13vw] md:text-[9rem]`).
- Body copy is `text-ink/80`, `leading-relaxed`.

**Interaction**
- Hover states are **inversions**, not tints: `hover:bg-ink hover:text-paper` (or the
  reverse on dark sections). Use `group` + `group-hover:` for per-child changes in a row.
- Transitions are `duration-100` for buttons, `duration-150` for text links. Nothing slower.
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
- The `images/` directory is currently unreferenced; removing it is out of scope, but don't
  assume assets exist.
- Content is hardcoded placeholder-ish copy (companies, project names, star counts). If asked
  to make content real, only replace strings — do not restructure the markup.