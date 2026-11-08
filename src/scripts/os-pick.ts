import { detectOs } from '../lib/os';

const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
const os = detectOs(nav.userAgent, nav.userAgentData?.platform || nav.platform || '', nav.maxTouchPoints || 0);
if (os) document.documentElement.dataset.os = os;
