# my_web

Personal portfolio for Himank Singhvi — React + Vite, no UI or animation libraries.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
npm run preview  # serve the build
```

## Editing

- **Copy** — everything lives in `src/content.js` (hero text, projects, experience, education, skills). Sourced from the resume.
- **Resume** — `public/Himank-Singhvi-Resume.pdf` is what the Resume links serve.
- **Project demos** — each featured project picks its interactive demo in `content.js` (`diagram.type`: `pipeline`, `zigsaw`, `attention`, `nfs`, or a static `flow`). They live in `src/components/Demos.jsx`.
- **Toys (Beyond code)** — canvas scenes in `src/scenes.js` (gravity, epicycles, oscilloscope are interactive; pot and garden are quiet backdrops) run by `src/hooks/useCanvas.js`; the piano is in `src/components/Hobbies.jsx`.
- **Hero animation** — `src/components/PursuitCanvas.jsx`, a small pursuit simulation (respects reduced motion).
- **Command menu** — `Ctrl/Cmd + K` or `/`, defined in `src/components/CommandPalette.jsx`. Sections, every featured project, resume download and theme toggle are searchable.
- **Tiny shell** — `src/components/Terminal.jsx`, a simulated shell whose files are generated from `content.js` (so it stays in sync with the page).
- **Autograd demo** — `src/components/Autograd.jsx`, shown as a tab next to the attention demo on the Transformer card.
- **Print** — `Ctrl+P` gives a clean light-theme read; toys and demos are hidden (`@media print` in `src/additions.css`).

## Link previews

`public/og.png` (1200×630) is the share image. Social crawlers need an absolute URL for it, so once the site has an address build with:

```bash
VITE_SITE_URL=https://your-domain.com npm run build
```

That fills in `og:image`, `twitter:image`, `og:url` and the canonical link (see `vite.config.js`). Without it, `og:image` is a relative path.

## Structure

```
src/
  content.js        all site copy
  styles.css        tokens (light: cream + cobalt, dark: near-black + aqua), layout, motion
  extra.css         NCSC card and small shared bits
  demos.css         demos, toys, command menu, progress bar
  additions.css     autograd, terminal, awards prefix, print styles
  scenes.js         canvas scenes for the toys
  components/       Header, Hero, PursuitCanvas, Work, Demos, Diagrams, Autograd, Terminal, Experience, About, Hobbies,
                    CommandPalette, ScrollProgress, Contact
  hooks/            useCanvas, useInView, useScrollSpy
```

Fonts: Bricolage Grotesque, Geist and Geist Mono via `@fontsource-variable/*` (self-hosted at build).
