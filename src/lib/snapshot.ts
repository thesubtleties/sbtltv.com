import { readdirSync } from 'node:fs';

// The catalogue (private sbtltv-lists repo) writes signed snapshots to lists/snapshots/<YYYY-MM-DD>.json,
// one per day the line-up changes. The site serves the newest one dated today or earlier (UTC); before
// the first one, the first one (its lists carry their own dates, and the app applies them).
export const SNAPSHOT_DIR = 'lists/snapshots';
const NAME = /^(\d{4}-\d{2}-\d{2})\.json$/;

export function pickSnapshot(dates: string[], today: string): string | null {
  const sorted = [...dates].sort();
  if (!sorted.length) return null;
  const past = sorted.filter((d) => d <= today);
  return past.length ? past[past.length - 1] : sorted[0];
}

/** Path of the snapshot to serve today (LISTS_DATE overrides the date for tests and previews). */
export function currentSnapshotPath(today = process.env.LISTS_DATE ?? new Date().toISOString().slice(0, 10)): string {
  const dates = readdirSync(SNAPSHOT_DIR).map((f) => NAME.exec(f)?.[1]).filter((d): d is string => !!d);
  const pick = pickSnapshot(dates, today);
  if (!pick) throw new Error(`no snapshots in ${SNAPSHOT_DIR}: run node scripts/publish.mjs in sbtltv-lists`);
  return `${SNAPSHOT_DIR}/${pick}.json`;
}
