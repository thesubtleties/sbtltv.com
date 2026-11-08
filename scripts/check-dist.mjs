// Checks the built site: works without JS, loads nothing from other hosts, keeps the CSP 'self'.
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const fail = [];

for (const p of ['win-setup', 'win-portable', 'mac-dmg', 'linux-appimage', 'linux-deb']) {
  const tags = [...html.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]).filter((t) => t.includes(`data-download="${p}"`));
  if (tags.length !== 1 || !/href="https:\/\/github\.com\/thesubtleties\/sbtlTV\/releases\/download\/[^"]+"/.test(tags[0])) {
    fail.push(`no single download link for ${p} in the HTML`);
  }
}
// JSON-LD is data, not code: CSP doesn't apply to it. Any other inline script would be blocked.
if (/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>/i.test(html)) fail.push('inline <script> found (CSP is self only)');
if (/<style[\s>]/i.test(html)) fail.push('inline <style> found');
if (/\sstyle="/i.test(html)) fail.push('style="" attribute found');
// Tags the browser fetches from. rel="canonical" is a link, not a request, so it's skipped.
for (const m of html.matchAll(/<(?:script|img|source|iframe|link)\b[^>]*?\b(?:src|href|srcset)="(?:https?:)?\/\/[^"]*"[^>]*>/gi)) {
  if (/^<link\b/i.test(m[0]) && /\brel="canonical"/i.test(m[0])) continue;
  fail.push(`loads from another host: ${m[0].slice(0, 120)}`);
}
for (const must of ['Apple Silicon', 'sample data', 'steven@sbtl.dev', 'not endorsed or certified by TMDB',
  'supporters.eff.org/donate', 'A clean, simple and smooth IPTV player for live TV, movies and series, on Windows, Mac and Linux.']) {
  if (!html.includes(must)) fail.push(`missing text: ${must}`);
}
for (const f of ['dist/lists/v1.json', 'dist/version.txt', 'dist/404.html']) if (!existsSync(f)) fail.push(`missing ${f}`);
if (html.includes('—')) fail.push('em dash in the page');

// Search and link previews
const version = existsSync('dist/version.txt') ? readFileSync('dist/version.txt', 'utf8').trim().replace(/^v/, '') : '';
const meta = (attr, name) => new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]+)"`).exec(html)?.[1];
if (!/<link[^>]*rel="canonical"[^>]*href="https:\/\/sbtltv\.com\/"/.test(html)) fail.push('no canonical link');
for (const p of ['og:title', 'og:description', 'og:url', 'og:type', 'og:site_name', 'og:image', 'og:image:alt']) {
  if (!meta('property', p)) fail.push(`missing ${p}`);
}
if (!meta('property', 'og:image')?.startsWith('https://sbtltv.com/')) fail.push('og:image must be an absolute sbtltv.com URL');
const ogPath = meta('property', 'og:image')?.replace('https://sbtltv.com/', 'dist/');
if (ogPath && existsSync(ogPath)) {
  const bytes = readFileSync(ogPath);
  // Link previews: small, and one frame. A JPEG's SOF0/SOF2 marker holds height then width.
  if (bytes.length > 1_000_000) fail.push(`og:image is ${bytes.length} bytes, keep it under 1 MB`);
  for (let i = 2; i < bytes.length - 9; i++) {
    if (bytes[i] === 0xff && (bytes[i + 1] === 0xc0 || bytes[i + 1] === 0xc2)) {
      const h = bytes.readUInt16BE(i + 5), w = bytes.readUInt16BE(i + 7);
      if (String(h) !== meta('property', 'og:image:height') || String(w) !== meta('property', 'og:image:width')) {
        fail.push(`og:image is ${w}x${h} but the tags say ${meta('property', 'og:image:width')}x${meta('property', 'og:image:height')}`);
      }
      break;
    }
  }
} else fail.push('og:image file not found in dist');
if (meta('name', 'twitter:card') !== 'summary_large_image') fail.push('twitter:card must be summary_large_image');
const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1];
try {
  const j = JSON.parse(ld ?? '');
  if (j['@type'] !== 'SoftwareApplication') fail.push('JSON-LD @type must be SoftwareApplication');
  if (j.softwareVersion !== version) fail.push(`JSON-LD softwareVersion ${j.softwareVersion} != ${version}`);
  if (j.offers?.price !== '0') fail.push('JSON-LD offers.price must be "0"');
} catch { fail.push('JSON-LD missing or not valid JSON'); }
for (const f of ['dist/robots.txt', 'dist/sitemap.xml', 'dist/llms.txt']) if (!existsSync(f)) fail.push(`missing ${f}`);

// Hero: three screenshots that crossfade, with labels that work without JS
if ((html.match(/class="frame /g) || []).length !== 3) fail.push('hero needs three screenshot frames');
for (const l of ['Live TV', 'Movies', 'Series']) if (!new RegExp(`<label[^>]*for="shot-[a-z]+"[^>]*>${l}</label>`).test(html)) fail.push(`missing shot label ${l}`);

// Background loop: present, small, muted autoplay loop, with a still for reduced motion
if (!/<video[^>]*\bautoplay\b[^>]*\bmuted\b[^>]*\bloop\b[^>]*\bplaysinline\b/.test(html)) fail.push('background video must be autoplay muted loop playsinline');
for (const f of ['dist/media/bg.webm', 'dist/media/bg.mp4', 'dist/media/bg-poster.webp']) {
  if (!existsSync(f)) fail.push(`missing ${f}`);
  else if (readFileSync(f).length > 300_000) fail.push(`${f} is over 300 KB`);
}

if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log('dist ok');
