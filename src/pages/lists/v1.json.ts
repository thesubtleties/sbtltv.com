import type { APIRoute } from 'astro';
import data from '../../../lists/v1.json';
import { validateListsFile } from '../../lib/lists';

export const GET: APIRoute = () => {
  const errors = validateListsFile(data);
  if (errors.length) throw new Error(`lists/v1.json is invalid:\n${errors.join('\n')}`);
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
};
