// Every download link in the built page must resolve (follows GitHub's redirect to the file).
import { readFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const urls = [...new Set([...html.matchAll(/href="(https:\/\/github\.com\/thesubtleties\/sbtlTV\/releases\/download\/[^"]+)"/g)].map((m) => m[1]))];
if (urls.length !== 5) { console.error(`expected 5 download links, found ${urls.length}`); process.exit(1); }
let bad = 0;
for (const u of urls) {
  const res = await fetch(u, { method: 'HEAD', redirect: 'follow' });
  if (!res.ok) { console.error(`${res.status} ${u}`); bad++; }
}
if (bad) process.exit(1);
console.log('links ok');
