import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { validateListsFile } from '../../lib/lists';

// Served byte for byte: the app verifies a signature over these exact bytes.
export const GET: APIRoute = () => {
  const raw = readFileSync('lists/v1.json', 'utf8');
  const errors = validateListsFile(JSON.parse(raw));
  if (errors.length) throw new Error(`lists/v1.json is invalid:\n${errors.join('\n')}`);
  return new Response(raw, { headers: { 'content-type': 'application/json' } });
};
