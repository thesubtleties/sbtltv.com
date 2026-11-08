import { describe, expect, test } from 'vitest';
import { fetchLatestRelease, formatDate, formatSize, toReleaseInfo, type GhRelease } from './release';

const base = 'https://github.com/thesubtleties/sbtlTV/releases/download/v0.15.0/';
const names = [
  'sbtlTV-0.15.0-win-x64-setup.exe', 'sbtlTV-0.15.0-win-x64-portable.exe', 'sbtlTV-0.15.0-mac-arm64.dmg',
  'sbtlTV-0.15.0-mac-arm64.zip', 'sbtlTV-0.15.0-linux-x86_64.AppImage', 'sbtlTV-0.15.0-linux-amd64.deb',
  'latest.yml', 'latest-mac.yml', 'latest-linux.yml', 'builder-debug.yml',
];
function release(over: Partial<GhRelease> = {}, assetNames = names): GhRelease {
  return {
    tag_name: 'v0.15.0', published_at: '2026-11-07T18:59:41Z', draft: false, prerelease: false,
    html_url: 'https://github.com/thesubtleties/sbtlTV/releases/tag/v0.15.0',
    assets: assetNames.map((name) => ({ name, browser_download_url: base + name, size: 150_996_639 })),
    ...over,
  };
}

describe('toReleaseInfo', () => {
  test('picks the five downloads', () => {
    const info = toReleaseInfo(release());
    expect(info.version).toBe('0.15.0');
    expect(info.date).toBe('2026-11-07');
    expect(info.downloads['mac-dmg'].name).toBe('sbtlTV-0.15.0-mac-arm64.dmg');
    expect(info.downloads['linux-deb'].url).toBe(base + 'sbtlTV-0.15.0-linux-amd64.deb');
    expect(Object.keys(info.downloads).sort()).toEqual(
      ['linux-appimage', 'linux-deb', 'mac-dmg', 'win-portable', 'win-setup']);
  });
  test('missing asset fails and names it', () => {
    expect(() => toReleaseInfo(release({}, names.filter((n) => !n.endsWith('.dmg')))))
      .toThrow(/mac-dmg/);
  });
  test('two matches for one platform fails', () => {
    expect(() => toReleaseInfo(release({}, [...names, 'sbtlTV-0.14.2-mac-arm64.dmg']))).toThrow(/mac-dmg/);
  });
  test('asset from another version fails', () => {
    const n = names.map((x) => x.replace('0.15.0-linux-amd64', '0.14.2-linux-amd64'));
    expect(() => toReleaseInfo(release({}, n))).toThrow(/linux-deb/);
  });
  test('pre-release or draft fails', () => {
    expect(() => toReleaseInfo(release({ prerelease: true }))).toThrow(/pre-release/);
    expect(() => toReleaseInfo(release({ draft: true }))).toThrow(/draft/);
  });
  test('tag that is not vX.Y.Z fails', () => {
    expect(() => toReleaseInfo(release({ tag_name: 'v0.15.0-beta.1' }))).toThrow(/tag/);
  });
  test('download URL outside the sbtlTV repo fails', () => {
    const r = release();
    r.assets[0]!.browser_download_url = 'https://example.com/x.exe';
    expect(() => toReleaseInfo(r)).toThrow(/URL/);
  });
});

describe('fetchLatestRelease', () => {
  test('throws on a non-200', async () => {
    const fake = (async () => new Response('rate limited', { status: 403 })) as typeof fetch;
    await expect(fetchLatestRelease(fake)).rejects.toThrow(/403/);
  });
  test('sends the token when given', async () => {
    let auth: string | null = null;
    const fake = (async (_u: string, init?: RequestInit) => {
      auth = new Headers(init?.headers).get('authorization');
      return Response.json(release());
    }) as typeof fetch;
    await fetchLatestRelease(fake, 'abc');
    expect(auth).toBe('Bearer abc');
  });
});

test('formatting', () => {
  expect(formatDate('2026-11-07')).toBe('Nov 7, 2026');
  expect(formatSize(150_996_639)).toBe('151 MB');
});
