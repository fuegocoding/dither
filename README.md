# dither.fuego.im

A pixel-perfect dithering utility that runs entirely in the browser. Drop an image, dial in the settings, and ship a dither — no uploads, no servers.

## Features

- **Live preview** — every tweak renders in real time
- **4 dither algorithms** — Bayer (ordered), Halftone, Noise, Crosshatch
- **4 color modes** — Duotone, Grayscale, Custom Palette, Original
- **9 preset palettes** — Game Boy, CGA, Mac SE, Magma, Forest, Cyber, Blueprint…
- **Custom palette editor** — up to 8 colors, add/remove live
- **Duotone theme sync** — in duotone mode, the preview swaps between a light and dark variant as you toggle the site theme
- **Light + Dark export** — in duotone mode, download both variants (white-bg + black-bg) in a single click
- **Animation** — animated noise dither for TV-static vibes
- **Fine controls** — pixel size, threshold, brightness, contrast, invert, fit, background
- **Download as PNG** — at source resolution, 1080p, or 2400p
- **Shareable URLs** — every setting encoded in the query string
- **Embed code** — drop a dithered preview anywhere via iframe
- **100% client-side** — works offline, no data leaves your machine

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui (radix-lyra preset, stone base, fire primary)
- next-themes (light/dark)
- @tabler/icons-react

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## URL params

All settings are encoded in the query string for shareable links:

```
?m=bayer&c=duotone&g=2&t=0.5&pc=%23000&sc=%23f77f00
```

| Key | Description |
| --- | --- |
| `m` | dither mode (bayer, halftone, noise, crosshatch) |
| `c` | color mode (duotone, grayscale, custom, original) |
| `g` | grid size (1-10) |
| `p` | pixel ratio |
| `t` | threshold (0-1) |
| `b` | brightness (-1 to 1) |
| `k` | contrast (0 to 2) |
| `i` | invert (0/1) |
| `a` | animated (0/1) |
| `as` | animation speed |
| `pc` | primary color (hex) |
| `sc` | secondary color (hex) |
| `f` | object fit (cover, contain, fill) |
| `bg` | background color (hex) |
| `pal` | custom palette (dash-separated hex) |

## Embed

```html
<iframe src="https://dither.fuego.im/?m=bayer&c=duotone&g=2&pc=%23000&sc=%23f77f00" width="720" height="540" style="border:0"></iframe>
```

## Deployment

Configured for Railway (`railway.json`). Set the custom domain to `dither.fuego.im`.
