import type { APIRoute } from 'astro';
import { getRelease } from '../lib/release';

export const GET: APIRoute = async () => {
  const { date } = await getRelease();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://sbtltv.com/</loc><lastmod>${date}</lastmod></url>
</urlset>
`;
  return new Response(xml, { headers: { 'content-type': 'application/xml' } });
};
