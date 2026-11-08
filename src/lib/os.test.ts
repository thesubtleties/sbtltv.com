import { expect, test } from 'vitest';
import { detectOs } from './os';

const cases: [string, string, string, number, ReturnType<typeof detectOs>][] = [
  ['Windows Chrome', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140', 'Windows', 0, 'windows'],
  ['Mac Safari', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605', 'MacIntel', 0, 'mac'],
  ['Mac Chrome UA-CH', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'macOS', 0, 'mac'],
  ['Linux Firefox', 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0', 'Linux x86_64', 0, 'linux'],
  ['iPadOS (desktop UA)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605', 'MacIntel', 5, null],
  ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone', 5, null],
  ['Android', 'Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/140 Mobile', 'Linux armv8l', 5, null],
  ['ChromeOS', 'Mozilla/5.0 (X11; CrOS x86_64 16000.0.0) Chrome/140', 'Linux x86_64', 0, null],
  ['unknown', 'curl/8.10', '', 0, null],
];

test.each(cases)('%s', (_name, ua, platform, touch, want) => {
  expect(detectOs(ua, platform, touch)).toBe(want);
});
