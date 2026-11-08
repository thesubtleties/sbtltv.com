export interface CuratedList { id: string; name: string; blurb: string; from?: string; until?: string; items: number[] }
export interface ListsFileV1 { v: 1; updated: string; movies: CuratedList[]; series: CuratedList[] }

const ID = /^[a-z0-9-]{1,48}$/;
const LINK = /https?:|www\.|\b[a-z0-9-]+\.(com|net|org|tv|io|me|gg|xyz|ru|cc|co|info|app|dev|link|ly)\b/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

function validDate(s: unknown): s is string {
  if (typeof s !== 'string' || !DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function checkText(where: string, field: string, value: unknown, max: number, errors: string[]) {
  if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
    errors.push(`${where}: ${field} must be 1-${max} characters`);
  } else if (LINK.test(value)) {
    errors.push(`${where}: ${field} must not contain a link`);
  }
}

// Returns every problem found; an empty array means the file is valid.
// Unknown top-level sections and unknown list fields are allowed so later kinds don't break older apps.
export function validateListsFile(data: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(data)) return ['file must be a JSON object'];
  if (data.v !== 1) errors.push('v must be 1');
  if (!validDate(data.updated)) errors.push('updated must be a YYYY-MM-DD date');
  const seen = new Set<string>();
  for (const section of ['movies', 'series'] as const) {
    const lists = data[section];
    if (!Array.isArray(lists)) { errors.push(`${section} must be an array`); continue; }
    lists.forEach((l, i) => {
      const where = `${section}[${i}]`;
      if (!isObject(l)) { errors.push(`${where}: must be an object`); return; }
      if (typeof l.id !== 'string' || !ID.test(l.id)) errors.push(`${where}: id must match ${ID}`);
      else if (seen.has(l.id)) errors.push(`${where}: duplicate id ${l.id}`);
      else seen.add(l.id);
      checkText(where, 'name', l.name, 40, errors);
      checkText(where, 'blurb', l.blurb, 140, errors);
      const items = l.items;
      if (!Array.isArray(items) || items.length < 1 || items.length > 100) {
        errors.push(`${where}: items must hold 1-100 TMDB ids`);
      } else {
        if (!items.every((n) => Number.isInteger(n) && (n as number) > 0)) errors.push(`${where}: items must be positive integers`);
        if (new Set(items).size !== items.length) errors.push(`${where}: items repeat`);
      }
      if (l.from !== undefined && !validDate(l.from)) errors.push(`${where}: from must be a YYYY-MM-DD date`);
      if (l.until !== undefined && !validDate(l.until)) errors.push(`${where}: until must be a YYYY-MM-DD date`);
      if (validDate(l.from) && validDate(l.until) && l.until <= l.from) errors.push(`${where}: until must be after from`);
    });
  }
  return errors;
}
