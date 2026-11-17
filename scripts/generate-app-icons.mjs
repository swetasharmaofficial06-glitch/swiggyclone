/**
 * App icon + splash source generator.
 *
 * Ek hi mark se saare assets banate hain:
 *   public/pwa-192x192.png, pwa-512x512.png, maskable-icon-512x512.png, apple-touch-icon.png
 *   assets/icon.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png
 *
 * `npm run app:icons` — output ko `@capacitor/assets` (app:assets) khaata hai.
 * Source design `public/favicon.svg` ka "D" mark hai, isliye branding ek jagah rehti hai.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const BRAND = '#fc8019'
const DARK = '#0e1014'
const WHITE = '#ffffff'

const MARK_PATH =
  'M20 18h9c9 0 15 5 15 14s-6 14-15 14h-9V18zm9 22c6 0 9-3 9-8s-3-8-9-8h-3v16h3z'
const MARK_DOT = { cx: 47, cy: 18, r: 4 }
// Mark ka approximate bounding box (64-unit viewBox) — centering ke liye.
const MARK_CENTER = { x: 34, y: 32 }
const MARK_WIDTH = 31

function mark(size, color, ratio) {
  const scale = (size * ratio) / MARK_WIDTH
  const tx = size / 2 - MARK_CENTER.x * scale
  const ty = size / 2 - MARK_CENTER.y * scale
  return `<g transform="translate(${tx} ${ty}) scale(${scale})">
    <path d="${MARK_PATH}" fill="${color}" />
    <circle cx="${MARK_DOT.cx}" cy="${MARK_DOT.cy}" r="${MARK_DOT.r}" fill="${color}" />
  </g>`
}

/** Full-bleed icon (PWA / store icon). */
function iconSvg({ size = 1024, background = BRAND, color = WHITE, ratio = 0.56 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${background}" />
    ${mark(size, color, ratio)}
  </svg>`
}

/** Adaptive icon foreground — transparent, mark safe zone ke andar. */
function foregroundSvg({ size = 1024, color = WHITE, ratio = 0.44 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${mark(size, color, ratio)}
  </svg>`
}

/** Splash screen — dark ya light background par rounded brand card. */
function splashSvg({ size = 2732, background = DARK, card = BRAND, color = WHITE, cardSize = 720 }) {
  const x = (size - cardSize) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${background}" />
    <rect x="${x}" y="${x}" width="${cardSize}" height="${cardSize}" rx="${cardSize * 0.22}" fill="${card}" />
    ${mark(cardSize, color, 0.5).replace(
      /translate\(([-\d.]+) ([-\d.]+)\)/,
      (_m, tx, ty) => `translate(${Number(tx) + x} ${Number(ty) + x})`,
    )}
  </svg>`
}

async function png(svg, file, size) {
  const out = path.join(ROOT, file)
  await mkdir(path.dirname(out), { recursive: true })
  await sharp(Buffer.from(svg)).resize(size).png().toFile(out)
  return file
}

const written = []

written.push(await png(iconSvg({ size: 1024 }), 'public/pwa-192x192.png', 192))
written.push(await png(iconSvg({ size: 1024 }), 'public/pwa-512x512.png', 512))
written.push(await png(iconSvg({ size: 1024 }), 'public/maskable-icon-512x512.png', 512))
written.push(await png(iconSvg({ size: 1024, ratio: 0.52 }), 'public/apple-touch-icon.png', 180))

written.push(await png(iconSvg({ size: 1024 }), 'assets/icon.png', 1024))
written.push(await png(foregroundSvg({ size: 1024 }), 'assets/icon-foreground.png', 1024))
written.push(await png(iconSvg({ size: 1024 }), 'assets/icon-background.png', 1024))
written.push(await png(splashSvg({ size: 2732 }), 'assets/splash.png', 2732))
written.push(
  await png(splashSvg({ size: 2732, background: '#ffffff', card: BRAND }), 'assets/splash-dark.png', 2732),
)

// Simple report manifest for debugging asset generation.
await writeFile(
  path.join(ROOT, 'assets/.generated.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), files: written }, null, 2)}\n`,
)

console.log('✓ App assets generate ho gaye:')
for (const file of written) console.log(`  - ${file}`)
