export type Platform = 'win-setup' | 'win-portable' | 'mac-dmg' | 'linux-appimage' | 'linux-deb';
export interface Download { name: string; url: string; size: number }
export interface ReleaseInfo {
  version: string; tag: string; date: string; notesUrl: string; downloads: Record<Platform, Download>;
}
export interface GhAsset { name: string; browser_download_url: string; size: number }
export interface GhRelease {
  tag_name: string; published_at: string; html_url: string; draft: boolean; prerelease: boolean; assets: GhAsset[];
}

const SUFFIX: Record<Platform, string> = {
  'win-setup': '-win-x64-setup.exe',
  'win-portable': '-win-x64-portable.exe',
  'mac-dmg': '-mac-arm64.dmg',
  'linux-appimage': '-linux-x86_64.AppImage',
  'linux-deb': '-linux-amd64.deb',
};
const DOWNLOAD_PREFIX = 'https://github.com/thesubtleties/sbtlTV/releases/download/';
const API = 'https://api.github.com/repos/thesubtleties/sbtlTV/releases/latest';

// Throws on anything that would put a wrong or dead download button on the page
export function toReleaseInfo(r: GhRelease): ReleaseInfo {
  if (r.draft) throw new Error(`latest release ${r.tag_name} is a draft`);
  if (r.prerelease) throw new Error(`latest release ${r.tag_name} is a pre-release`);
  const m = /^v(\d+\.\d+\.\d+)$/.exec(r.tag_name);
  if (!m) throw new Error(`latest release tag ${r.tag_name} is not vX.Y.Z`);
  const version = m[1]!;
  const problems: string[] = [];
  const downloads = {} as Record<Platform, Download>;
  for (const platform of Object.keys(SUFFIX) as Platform[]) {
    const hits = r.assets.filter((a) => a.name.endsWith(SUFFIX[platform]));
    const exact = hits.filter((a) => a.name.endsWith(`-${version}${SUFFIX[platform]}`));
    if (hits.length !== 1 || exact.length !== 1) {
      problems.push(`${platform} (${hits.length} files, ${exact.length} for ${version})`);
      continue;
    }
    const a = exact[0]!;
    if (!a.browser_download_url.startsWith(DOWNLOAD_PREFIX)) {
      problems.push(`${platform} URL is outside the sbtlTV repo`);
      continue;
    }
    downloads[platform] = { name: a.name, url: a.browser_download_url, size: a.size };
  }
  if (problems.length) throw new Error(`release ${r.tag_name}: ${problems.join('; ')}`);
  return { version, tag: r.tag_name, date: r.published_at.slice(0, 10), notesUrl: r.html_url, downloads };
}

export async function fetchLatestRelease(
  fetchImpl: typeof fetch = fetch,
  token: string | undefined = process.env.GITHUB_TOKEN,
): Promise<ReleaseInfo> {
  const headers: Record<string, string> = { accept: 'application/vnd.github+json', 'user-agent': 'sbtltv-site-build' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetchImpl(API, { headers });
  if (!res.ok) throw new Error(`GitHub API answered ${res.status} for the latest release`);
  return toReleaseInfo((await res.json()) as GhRelease);
}

let cached: Promise<ReleaseInfo> | undefined;
export function getRelease(): Promise<ReleaseInfo> {
  cached ??= fetchLatestRelease();
  return cached;
}

export function formatDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function formatSize(bytes: number): string {
  return `${Math.round(bytes / 1_000_000)} MB`;
}
