import { describe, expect, test } from 'vitest';
import { validateListsFile, validateListsSize } from './lists';

const list = (over: Record<string, unknown> = {}) => ({
  id: 'halloween-classics', name: 'Halloween classics', blurb: 'Old favourites.', items: [694, 948, 539], ...over,
});
const file = (over: Record<string, unknown> = {}) => ({ v: 1, updated: '2026-11-07', movies: [list()], series: [], ...over });

describe('validateListsFile', () => {
  test('a good file passes, with dates', () => {
    expect(validateListsFile(file({ movies: [list({ from: '2026-10-01', until: '2026-11-01' })] }))).toEqual([]);
  });
  test('unknown sections and fields are allowed (forward compatible)', () => {
    expect(validateListsFile(file({ sports: [{ anything: true }], movies: [list({ art: 'x' })] }))).toEqual([]);
  });
  test('wrong version', () => {
    expect(validateListsFile(file({ v: 2 })).join()).toMatch(/v must be 1/);
  });
  test('missing movies or series', () => {
    expect(validateListsFile({ v: 1, updated: '2026-11-07', movies: [] }).join()).toMatch(/series/);
  });
  test('bad id', () => {
    expect(validateListsFile(file({ movies: [list({ id: 'Halloween!' })] })).join()).toMatch(/id/);
  });
  test('duplicate id across movies and series', () => {
    expect(validateListsFile(file({ series: [list()] })).join()).toMatch(/duplicate/);
  });
  test('name and blurb limits', () => {
    expect(validateListsFile(file({ movies: [list({ name: 'x'.repeat(41) })] })).join()).toMatch(/name/);
    expect(validateListsFile(file({ movies: [list({ blurb: 'x'.repeat(141) })] })).join()).toMatch(/blurb/);
    expect(validateListsFile(file({ movies: [list({ name: '' })] })).join()).toMatch(/name/);
  });
  test('URLs in text', () => {
    for (const blurb of ['see https://x.y', 'go to www.thing', 'visit example.com now']) {
      expect(validateListsFile(file({ movies: [list({ blurb })] })).join()).toMatch(/link/);
    }
  });
  test('items: empty, too many, repeats, non-integers', () => {
    const bad = [[], Array.from({ length: 101 }, (_, i) => i + 1), [1, 1], [1.5], [0], ['12']];
    for (const items of bad) expect(validateListsFile(file({ movies: [list({ items })] }))).not.toEqual([]);
  });
  test('dates: format and order', () => {
    expect(validateListsFile(file({ movies: [list({ from: '2026-13-01' })] })).join()).toMatch(/from/);
    expect(validateListsFile(file({ movies: [list({ from: '2026-11-02', until: '2026-11-01' })] })).join())
      .toMatch(/until/);
    expect(validateListsFile(file({ updated: 'yesterday' })).join()).toMatch(/updated/);
  });
  test('the app\'s caps: at most 50 lists per type', () => {
    const many = Array.from({ length: 51 }, (_, i) => list({ id: `l${i}` }));
    expect(validateListsFile(file({ movies: many })).join()).toMatch(/50/);
    expect(validateListsFile(file({ movies: many.slice(0, 50) }))).toEqual([]);
  });
  test('the app\'s caps: the file stays under 256 KB', () => {
    expect(validateListsSize('x'.repeat(256 * 1024 + 1))).toMatch(/256 KB/);
    expect(validateListsSize('{}')).toBeNull();
  });
  test('not an object', () => {
    expect(validateListsFile(null)).not.toEqual([]);
    expect(validateListsFile([])).not.toEqual([]);
  });
});
