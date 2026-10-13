/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        // Channels (space-separated RGB) so Tailwind opacity modifiers work
        // (`text-ink/70`). The actual values are CSS variables defined in
        // css/input.css — `:root` holds the light theme and
        // `[data-theme="dark"]` overrides them. Both themes are pure
        // black & white: ink and paper simply swap.
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
      },
      fontFamily: {
        // Per ../FONTS.md: Instrument Serif (display, ships 400 only — never
        // add font-bold to font-serif headings, it would faux-bold),
        // DM Sans (body + navigation), IBM Plex Mono (labels/dates/metadata).
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      maxWidth: {
        site: '72rem',
      },
    },
  },
  plugins: [],
};