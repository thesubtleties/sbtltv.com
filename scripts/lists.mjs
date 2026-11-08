// pnpm lists [--write]
// Reads lists/draft.json (titles + years), finds each on TMDB, prints what matched (title, year,
// other same-name entries for series), reports how many each list has in your local sbtlTV library,
// and with --write turns the draft into lists/v1.json (ids only). Then: pnpm sign-lists.
// Token: TMDB API Read Access Token in ~/.config/sbtltv-lists/tmdb.env (TMDB_TOKEN=..., or just the
// token, line breaks ignored) or the TMDB_TOKEN environment variable. Never committed.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';

const WRITE = process.argv.includes('--write');
function token() {
  if (process.env.TMDB_TOKEN) return process.env.TMDB_TOKEN.trim();
  const raw = readFileSync(`${homedir()}/.config/sbtltv-lists/tmdb.env`, 'utf8');
  const joined = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join('');
  return joined.replace(/^TMDB_TOKEN\s*=\s*/, '').replace(/^["']|["']$/g, '');
}
const TOKEN = token();
const cachePath = 'lists/.tmdb-cache.json'; // gitignored: search results, so re-runs are fast
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {};

async function tmdb(path, params) {
  const url = `https://api.themoviedb.org/3${path}?${new URLSearchParams(params)}`;
  if (cache[url]) return cache[url];
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json', 'User-Agent': 'sbtltv-lists' } });
  if (!res.ok) throw new Error(`TMDB ${res.status} for ${path}`);
  const data = await res.json();
  cache[url] = data;
  return data;
}

// An entry is [title, year], [title, year, "all"] (series: also take same-name variants), or { tmdb: id }.
async function resolve(entry, kind) {
  if (!Array.isArray(entry)) return { ids: [entry.tmdb], label: `#${entry.tmdb} (pinned)`, ok: true };
  const [title, year, mode] = entry;
  const path = kind === 'movies' ? '/search/movie' : '/search/tv';
  const yearKey = kind === 'movies' ? 'primary_release_year' : 'first_air_date_year';
  let data = await tmdb(path, { query: title, [yearKey]: String(year), include_adult: 'false' });
  if (!data.results?.length) data = await tmdb(path, { query: title, include_adult: 'false' });
  const results = data.results ?? [];
  if (!results.length) return { ids: [], label: `${title} (${year}): NOT FOUND`, ok: false };
  const best = results[0];
  const name = best.title ?? best.name;
  const got = (best.release_date ?? best.first_air_date ?? '').slice(0, 4);
  const ids = [best.id];
  let extra = '';
  if (mode === 'all') {
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const variants = results.slice(1).filter((r) => norm(r.name ?? r.title).includes(norm(title)) || norm(title).includes(norm(r.name ?? r.title)));
    for (const v of variants) ids.push(v.id);
    if (variants.length) extra = ` + variants: ${variants.map((v) => `${v.name ?? v.title} (${(v.first_air_date ?? v.release_date ?? '').slice(0, 4)}) #${v.id}`).join(', ')}`;
  }
  const flag = got !== String(year) || name.toLowerCase() !== title.toLowerCase() ? '  <-- check' : '';
  return { ids, label: `${title} (${year}) -> ${name} (${got}) #${best.id}${extra}${flag}`, ok: true };
}

// Local library coverage (read-only): how many of each list your own provider has.
let db = null;
const dbPath = `${homedir()}/.config/@sbtltv/electron/sbtltv-data.sqlite`;
if (existsSync(dbPath)) {
  const { DatabaseSync } = await import('node:sqlite');
  db = new DatabaseSync(dbPath, { readOnly: true });
}
const have = (kind, ids) => {
  if (!db || !ids.length) return null;
  const table = kind === 'movies' ? 'vod_movies' : 'vod_series';
  const row = db.prepare(`select count(distinct tmdb_id) as n from ${table} where tmdb_id in (select value from json_each(?))`).get(JSON.stringify(ids));
  return row.n;
};

const draft = JSON.parse(readFileSync('lists/draft.json', 'utf8'));
const out = { v: 1, updated: new Date().toISOString().slice(0, 10), movies: [], series: [] };
let problems = 0;
for (const kind of ['movies', 'series']) {
  for (const list of draft[kind] ?? []) {
    console.log(`\n== ${kind}: ${list.name} [${list.id}]${list.from ? ` from ${list.from}` : ''}${list.until ? ` until ${list.until}` : ''}`);
    const ids = [];
    for (const entry of list.titles) {
      const r = await resolve(entry, kind);
      if (!r.ok) problems++;
      console.log(`  ${r.ok ? ' ' : '!'} ${r.label}`);
      for (const id of r.ids) if (!ids.includes(id)) ids.push(id);
    }
    const n = have(kind, ids);
    console.log(`  -> ${ids.length} ids${n === null ? '' : `, your library has ${n}`}${ids.length > 100 ? '  !! over 100' : ''}`);
    const { titles, ...meta } = list;
    out[kind].push({ ...meta, items: ids.slice(0, 100) });
  }
}
writeFileSync(cachePath, JSON.stringify(cache));
if (problems) console.log(`\n${problems} title(s) not found; fix the draft before --write.`);
if (WRITE && !problems) {
  writeFileSync('lists/v1.json', JSON.stringify(out, null, 1) + '\n');
  console.log('\nwrote lists/v1.json; next: pnpm sign-lists, pnpm build, commit, push');
}
