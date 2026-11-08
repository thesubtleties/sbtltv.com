export type Os = 'windows' | 'mac' | 'linux';

// null = don't highlight any platform (phones, tablets, ChromeOS, unknown)
export function detectOs(ua: string, platform: string, maxTouchPoints: number): Os | null {
  const s = `${platform} ${ua}`;
  if (/android|iphone|ipad|ipod|cros/i.test(s)) return null;
  if (/mac/i.test(s)) return maxTouchPoints > 1 ? null : 'mac'; // iPadOS reports a Mac
  if (/win/i.test(s)) return 'windows';
  if (/linux|x11/i.test(s)) return 'linux';
  return null;
}
