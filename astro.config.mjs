// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sbtltv.com',
  output: 'static',
  // CSP is 'self' only: keep every script and stylesheet in its own file
  build: { inlineStylesheets: 'never', assets: '_astro' },
  vite: { build: { assetsInlineLimit: 0 } },
  devToolbar: { enabled: false },
});
