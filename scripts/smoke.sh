#!/usr/bin/env bash
# Usage: scripts/smoke.sh http://localhost:8080   (or https://sbtltv.com)
set -euo pipefail
base="${1:?base url}"
fail() { echo "FAIL: $*" >&2; exit 1; }
header() { grep -i "^$1:" | head -1 | cut -d' ' -f2- | tr -d '\r'; }

h=$(curl -fsS -D - -o /dev/null "$base/")
grep -qi "^content-security-policy: default-src 'self'" <<<"$h" || fail "no CSP on /"
grep -qi '^x-content-type-options: nosniff' <<<"$h" || fail "no nosniff on /"

h=$(curl -fsS -D - -o /dev/null "$base/lists/v1.json")
grep -qi '^content-type: application/json' <<<"$h" || fail "lists not application/json"
grep -qi '^cache-control: public, max-age=3600' <<<"$h" || fail "lists cache-control"
grep -qi '^content-security-policy:' <<<"$h" || fail "no CSP on lists (add_header inheritance)"
etag=$(header etag <<<"$h")
[ -n "$etag" ] || fail "no ETag on lists"
code=$(curl -sS -o /dev/null -w '%{http_code}' -H "If-None-Match: $etag" "$base/lists/v1.json")
[ "$code" = 304 ] || fail "lists repeat gave $code, want 304"
etagz=$(curl -fsS --compressed -D - -o /dev/null "$base/lists/v1.json" | header etag)
code=$(curl -sS -o /dev/null -w '%{http_code}' --compressed -H "If-None-Match: $etagz" "$base/lists/v1.json")
[ "$code" = 304 ] || fail "compressed lists repeat gave $code, want 304"

curl -fsS "$base/version.txt" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$' || fail "version.txt"
code=$(curl -sS -o /dev/null -w '%{http_code}' "$base/nope")
[ "$code" = 404 ] || fail "missing page gave $code, want 404"
echo "smoke ok: $base"
