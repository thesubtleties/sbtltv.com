import type { ReleaseInfo } from './release';

export const DESCRIPTION =
  'A clean, simple and smooth IPTV player for live TV, movies and series, on Windows, Mac and Linux. From your own provider, free and open source.';

export function softwareJsonLd(release: ReleaseInfo, imageUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'sbtlTV',
    description: DESCRIPTION,
    url: 'https://sbtltv.com/',
    image: imageUrl,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Windows 10, Windows 11, macOS 13 or later (Apple Silicon), Linux',
    softwareVersion: release.version,
    datePublished: release.date,
    downloadUrl: 'https://github.com/thesubtleties/sbtlTV/releases/latest',
    releaseNotes: release.notesUrl,
    license: 'https://www.gnu.org/licenses/agpl-3.0.html',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    sameAs: ['https://github.com/thesubtleties/sbtlTV'],
  };
}
