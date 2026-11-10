# sbtltv.com

The sbtlTV website and the Selected lists file the app reads (`/lists/v1.json`).
Static Astro site, no analytics, no third-party requests. AGPL-3.0.

    pnpm install && pnpm dev

## How it updates

- The build reads the latest stable sbtlTV release from GitHub and bakes the download links in. If any
  file is missing or GitHub doesn't answer, the build fails and the live site stays as it was.
- `Deploy` runs on push to main and hourly; the hourly run only builds when the registry has no
  image tagged with the newest release yet (`ghcr.io/thesubtleties/sbtltv-web:vX.Y.Z`), or when the
  lists snapshot for today (UTC) isn't the one live.
  GitHub turns scheduled workflows off after 60 days without repo activity: publishing lists keeps it
  alive, otherwise run Deploy by hand after a release.
- The cluster restarts the site hourly to pull the new image (no cluster credentials in GitHub).

## Lists

The lists are planned in the private `sbtltv-lists` repo (the full catalogue, dates, and the tools).
Its `publish` writes `lists/snapshots/<YYYY-MM-DD>.json` + `.sig` here: one per day the line-up
changes, signed there with a key that never leaves the maintainer's machine. Each holds only the lists
on that day and those starting within a week.

The build serves the newest snapshot dated today or earlier as `/lists/v1.json` (`src/lib/snapshot.ts`),
byte for byte, and fails on an invalid or unsigned one; the app ignores a bad signature anyway.
`lists/public-key.pem` is the matching public key. After publishing: `pnpm build && pnpm check-dist`,
commit, push.

## Privacy

No analytics, cookies or third-party requests. nginx keeps no access log. See the site's Privacy section.
