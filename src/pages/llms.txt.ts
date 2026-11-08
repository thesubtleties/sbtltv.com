import type { APIRoute } from 'astro';
import { getRelease } from '../lib/release';

// A plain summary for AI assistants and answer engines (llmstxt.org)
export const GET: APIRoute = async () => {
  const r = await getRelease();
  return new Response(`# sbtlTV

> A clean, simple and smooth IPTV player for live TV, movies and series, on Windows, Mac and Linux. Free and open source (AGPL-3.0). It plays live TV, movies and series from the user's own provider (Xtream login or M3U playlist). It does not provide, host or sell any content.

Current version: ${r.version} (${r.date}). Release notes: ${r.notesUrl}

## Downloads
- Windows 10 or 11 (64-bit): installer and portable, mpv included
- macOS 13 or later, Apple Silicon only: .dmg, signed and notarized
- Linux x86_64: AppImage (updates itself) and .deb; needs mpv from the package manager
- All files: https://github.com/thesubtleties/sbtlTV/releases/latest

## Features
- Live TV with a program guide (provider or XMLTV) and search for shows across all channels
- Movies and Series home pages, watchlist, resume where you left off
- Rewind live TV
- Subtitles and live captions; subtitles from SubDL when a title has none
- Several sources at once with priority and merging
- Streams reconnect on their own
- Themes: sbtl, Catppuccin, Gruvbox, Nord, Tokyo Night and more

## Privacy
- No account, no analytics. Sources, logins and history stay on the user's computer
- The website has no analytics or third-party requests
- Source code: https://github.com/thesubtleties/sbtlTV
`);
};
