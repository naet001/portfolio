# Nommoh Hayab — Portfolio

Single-page static portfolio for **Nommoh Isaac Hayab**, backend engineer. Strict Minimalist Monochrome design — pure black & white, oversized serif display type, hairline rules, zero radius, flat surfaces.

**Stack:** HTML5 + Tailwind CSS v3.4 + vanilla JS. No framework, no bundler, no client-side router. The entire site is one `index.html` plus a tiny enhancement script.

---

## Features

- **One-page layout** — Hero, About, Projects, Experience, Contact, and Footer, each a full `<section>` linked from the fixed header.
- **Dark / light theme** — pure inversion (`ink ↔ paper`), persisted in `localStorage`, seeded before first paint from an inline bootstrap in `<head>`, follows `prefers-color-scheme` when no choice is stored.
- **Sweep hover** — left-to-right fill wipe (`sweep-ink` / `sweep-paper` in `css/input.css`), not an instant inversion.
- **Responsive** — 12-column grid, 72rem max-width container (`max-w-site`), mobile nav with `aria-expanded` toggle.
- **Accessible** — skip link, `:focus-visible` outlines (3px / 3px offset, inverted on dark blocks), ≥44px touch targets, `prefers-reduced-motion`.

## Design System — Minimalist Monochrome

The canonical spec is [`../STYLE.md`](../STYLE.md); [`../FONTS.md`](../FONTS.md) maps every element to a typeface. Binding rules:

- **Palette:** only `#000000` / `#FFFFFF`. Tokens are `ink`, `paper`, `muted` (`#525252` / `#A3A3A3`), `line` (`#E5E5E5` / `#303030`) — CSS-variable channel triplets in `css/input.css`, aliased in `tailwind.config.js` as `rgb(var(--color-*) / <alpha>)` so `text-ink/70` works.
- **Typography:** Instrument Serif (display, 400 only — never `font-bold`), DM Sans (body + nav), IBM Plex Mono (labels / dates / metadata).
- **Geometry:** zero `border-radius`, no shadows, no gradients, no accent colors. Borders are `1px / 2px / 4px` rules; section dividers are `border-b-[4px]`.
- **Motion:** color flips 150ms (60ms delay on sweeps), sweep fill 260ms. Nothing slower. Cross-fade on theme switch is scoped to a temporary `data-theme-switch` attribute.
- **Never add `dark:` variants** — use the tokens; dark is an inversion.

## Tech Stack

| Layer | Detail |
|---|---|
| Markup | `index.html` — semantic HTML5, Tailwind content scan covers this file only |
| Styling | `css/input.css` → `css/main.css` via Tailwind CLI; hand-written base resets, focus rings, photo treatments, sweep hover |
| Script | `js/main.js` — ES5 IIFEs, no deps: theme toggle + mobile nav + header scroll behavior |
| Fonts | Google Fonts — Instrument Serif, DM Sans, IBM Plex Mono |
| Images | `images/` + `public/Isaac-Hayab-CV-1.pdf` (resume download) |

## Project Structure

```
portfolio/                  # ← git root
├── index.html              # the entire site
├── css/
│   ├── input.css           # source — @tailwind directives + custom CSS
│   └── main.css            # generated output (committed, do not hand-edit)
├── js/main.js              # vanilla JS enhancements
├── images/                 # hero / contact photos
├── public/                 # Isaac-Hayab-CV-1.pdf
├── tailwind.config.js      # color/font/width tokens
├── package.json            # tailwindcss 3.4 devDependency
└── .gitignore
```

`css/main.css` is build output. Edit `css/input.css` and rebuild — never hand-edit `main.css`.

## Getting Started

**Prerequisites:** Node 18+ (for the Tailwind CLI).

```bash
# from portfolio/
npm install          # install tailwindcss 3.4
npm run build        # css/input.css → css/main.css (minified)
npm run dev          # same, with --watch

# serve
python3 -m http.server 8000
# then open http://localhost:8000/index.html
# or just open index.html directly — no modules, no fetch
```

After changing classes in `index.html` or rules in `css/input.css`, run `npm run build` (or leave `npm run dev` running) and commit the regenerated `css/main.css`.

There is no test suite, linter, or formatter — verify visually in both themes.

## Scripts

| Script | Command |
|---|---|
| `npm run build` | `tailwindcss -i ./css/input.css -o ./css/main.css --minify` |
| `npm run dev` | `tailwindcss -i ./css/input.css -o ./css/main.css --watch` |

## Theming

- `tailwind.config.js` defines tokens as `rgb(var(--color-* ) / <alpha-value>)`.
- Actual channel values live in `css/input.css` (`:root` = light, `[data-theme='dark']` = dark).
- The inline `<script>` in `<head>` must stay above the stylesheet link — it sets `data-theme` on `<html>` before first paint to avoid a flash.
- `bg-ink text-paper` blocks (contact, footer) become light on dark automatically — that's intentional.
- Never hardcode `#000`/`#fff` in `input.css`; use `rgb(var(--color-ink))` / `rgb(var(--color-paper))`.

## Conventions

- Layout: `max-w-site mx-auto px-6 md:px-10` wrapper per section; `md:grid-cols-12` with `col-span` placement.
- Micro-labels: `font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted`.
- Headlines: `font-serif tracking-tight`, viewport-sized (`text-[13vw] md:text-[9rem]`).
- Body: `text-ink/80 leading-relaxed`.
- Hover: `sweep-ink hover:text-paper` on paper, `sweep-paper hover:text-ink` on ink; use `group` for row sweeps.
- Commit messages: conventional-commit subject + `-` bullet list of what/why.

## Deploy (Vercel)

`vercel.json` is checked in and is the source of truth. Production builds run on Vercel:

```bash
npm install        # installCommand
npm run build      # buildCommand — regenerates css/main.css from css/input.css
```

- `outputDirectory` is the repo root — Vercel serves the working tree directly, so all asset
  paths in `index.html` and `css/input.css` stay **relative** (no `/css/main.css`).
- Vercel recompiles the CSS on every deploy, so the committed `css/main.css` can never drift in
  production. It is still tracked so `file://` previews and GitHub Pages keep working.
- `.vercelignore` keeps `AGENTS.md` and `README.md` out of the upload. Don't add
  `package.json`, `package-lock.json`, `css/input.css`, or `tailwind.config.js` to it — the
  remote build needs all four.
- `vercel.json` also sets cache headers: `css/`, `js/`, and `public/` revalidate per request;
  `images/` are content-stable, so they get a one-year `immutable` cache.

Push to `main` and Vercel deploys from `origin`.

## License

Private portfolio. All rights reserved.
