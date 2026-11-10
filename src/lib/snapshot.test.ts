import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { pickSnapshot, currentSnapshotPath } from './snapshot';
import { validateListsFile, validateListsSize } from './lists';

test('the newest snapshot dated today or earlier is served', () => {
  const dates = ['2026-11-30', '2026-11-10', '2026-11-19'];
  expect(pickSnapshot(dates, '2026-11-18')).toBe('2026-11-10');
  expect(pickSnapshot(dates, '2026-11-19')).toBe('2026-11-19');
  expect(pickSnapshot(dates, '2027-03-01')).toBe('2026-11-30');
});

test('before the first snapshot, the first one; none at all, nothing', () => {
  expect(pickSnapshot(['2026-12-01'], '2026-11-01')).toBe('2026-12-01');
  expect(pickSnapshot([], '2026-11-01')).toBeNull();
});

test('the snapshot served today is valid', () => {
  const raw = readFileSync(currentSnapshotPath(), 'utf8');
  expect(validateListsSize(raw)).toBeNull();
  expect(validateListsFile(JSON.parse(raw))).toEqual([]);
});
