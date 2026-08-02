# Plan: Paige Photography Portfolio — Homepage Build

## Context
Building a greenfield photographer portfolio website for "Paige" (landscape + action). The site will eventually be multi-page and publicly deployed. This session builds the complete homepage plus nav-linked stub pages. The aesthetic is clean, digital, and image-first: cream background, sharp sans/mono typography, generous whitespace, strict grid spacing. No build system — pure HTML/CSS/JS for zero-friction deployment to any static host (Netlify, GitHub Pages, Cloudflare Pages, etc.).

---

## File Structure
```
/Users/gianlagemann/Documents/Portfolio/
├── index.html          # Homepage (full)
├── galleries.html      # Stub page — galleries by category
├── about.html          # Stub page — about Paige
├── contact.html        # Stub page — contact + socials
├── css/
│   └── style.css       # All styles (reset, layout, hero, grid, typography)
├── js/
│   └── hero.js         # Hero crossfade + Ken Burns controller
└── images/
    ├── hero/           # 5–7 images for the cycling hero
    └── gallery/        # Grid thumbnails for "Recent Work" section
```

---

## Tech Choices
- **No framework, no build step** — plain HTML/CSS/JS. Deployable by dragging to Netlify.
- **Google Fonts**: `Space Grotesk` (300, 400, 600) — sharp, modern, geometric. Loaded via `<link>`.
- **CSS Grid** for Recent Work section; `position: absolute` stack for hero layers.
- **No dependencies** — everything in vanilla JS and CSS.

---

## Homepage Sections (index.html)

### 1. Navigation
- Fixed top bar, full width
- Left: "PAIGE" logotype in Space Grotesk 600, letter-spacing wide
- Right: `GALLERIES  |  ABOUT  |  CONTACT` — all caps, 300 weight, letter-spacing
- Background: transparent over hero, transitions to `rgba(247,244,239,0.95)` on scroll (JS scroll listener)
- No hamburger menu on this build (add later)

### 2. Hero — Crossfading Ken Burns
- Full-viewport (`100vw × 100vh`), `overflow: hidden`
- 5–7 `<img>` elements stacked via `position: absolute; inset: 0; object-fit: cover; width: 100%; height: 100%`
- All `opacity: 0` initially except the first (`opacity: 1`)
- 5 named CSS `@keyframes` for Ken Burns moves (varied zoom + drift directions):
  - `kb-zoom-in`: `scale(1.0)` → `scale(1.08)`, centered
  - `kb-drift-right`: `scale(1.06) translateX(-2%)` → `scale(1.06) translateX(2%)`
  - `kb-drift-left`: reverse of above
  - `kb-zoom-pan-tl`: zoom + drift top-left → bottom-right
  - `kb-zoom-pan-tr`: zoom + drift top-right → bottom-left
- Each animation: `duration: 8s, timing: ease-in-out, fill-mode: forwards`
- `hero.js` controller:
  - On load: apply random KB animation to first image
  - Every 6 seconds: fade out current (`opacity → 0, transition: 1.5s`), pick next image randomly (no immediate repeat), apply new random KB animation, fade in new image
  - Cycle is continuous and endless
- Hero overlay: subtle gradient at bottom (`transparent → rgba(247,244,239,0.4)`) to blend into page below
- Optional: minimal text badge bottom-left — "PAIGE / PHOTOGRAPHY" in mono, very small, low opacity

### 3. Recent Work Grid
- Section title: `RECENT WORK` — all caps, Space Grotesk 300, wide letter-spacing, left-aligned
- CSS Grid: `grid-template-columns: repeat(3, 1fr)` on desktop, `repeat(2, 1fr)` tablet, `1fr` mobile
- Gap: `12px` — tight grid, digital feel
- ~6 images, each `aspect-ratio: 3/2` (landscape-native)
- `object-fit: cover` on all images
- Hover: subtle `opacity: 0.85` transition (100ms) — no heavy overlays
- Each image wrapped in `<a>` pointing to `galleries.html` for now

### 4. About Teaser
- Single centered column, max-width `600px`
- 2–3 lines of placeholder bio text for Paige
- Small `→ ABOUT ME` link below, same all-caps style

### 5. Footer
- Thin top border (`1px solid #E0DDD7`)
- Left: `© 2026 Paige`
- Right: social icons or text links (placeholder: Instagram, 500px)

---

## Color & Typography System (style.css)

```
--bg:       #F7F4EF   (warm cream, nearly white)
--fg:       #1C1C1C   (near black)
--muted:    #9A9490   (for captions, nav inactive)
--border:   #E0DDD7

Font-family: 'Space Grotesk', sans-serif
Nav links:  0.75rem / 600 / letter-spacing: 0.15em / uppercase
Section headers: 0.8rem / 300 / letter-spacing: 0.25em / uppercase
Body: 1rem / 400 / line-height: 1.7
```

---

## Stub Pages (galleries.html, about.html, contact.html)
Each gets:
- Same nav as homepage
- Centered placeholder text: e.g. "GALLERIES — Coming soon."
- Same footer
- Same CSS/font imports

This lets nav links work immediately without dead 404s.

---

## Image Placeholders
Since Paige hasn't provided real images yet, the build will use:
- `images/hero/` → reference 5 placeholder filenames in hero.js (e.g. `hero-1.jpg` through `hero-5.jpg`)
- Add clear `<!-- REPLACE WITH REAL IMAGES -->` comments in HTML and JS
- The CSS/layout will look correct once real images are dropped in with matching filenames

---

## Verification
1. Open `index.html` directly in browser (no server needed for static HTML)
2. Confirm hero animates: images should slowly drift/zoom, then crossfade every ~6s
3. Confirm nav is transparent over hero, turns cream on scroll
4. Confirm Recent Work grid is 3-col on wide viewport, responsive on resize
5. Confirm nav links to stub pages work without 404
6. Check mobile layout at 375px width (DevTools)
