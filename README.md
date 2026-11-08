# sbtltv.com

The sbtlTV website and the curated lists file the app reads (`lists/v1.json`).
Static Astro site, no analytics, no third-party requests. AGPL-3.0.

    pnpm install && pnpm dev

## How it updates

- The build reads the latest stable sbtlTV release from GitHub and bakes the download links in. If any
  file is missing or GitHub doesn't answer, the build fails and the live site stays as it was.
- `Deploy` runs on push to main and hourly; the hourly run only rebuilds when a new release is out.
  GitHub turns scheduled workflows off after 60 days without repo activity: list updates keep it alive,
  otherwise run Deploy by hand after a release.
- The cluster restarts the site hourly to pull the new image (no cluster credentials in GitHub).

## Lists

`lists/v1.json` is served at `https://sbtltv.com/lists/v1.json` and read by the sbtlTV app. The build
fails on an invalid file (see `src/lib/lists.ts`).

## Privacy

No analytics, cookies or third-party requests. nginx keeps no access log. See the site's Privacy section.
