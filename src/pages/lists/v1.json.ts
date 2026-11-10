import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { validateListsFile, validateListsSize } from '../../lib/lists';
import { currentSnapshotPath } from '../../lib/snapshot';

// Today's snapshot, served byte for byte: the app verifies a signature over these exact bytes.
export const GET: APIRoute = () => {
  const path = currentSnapshotPath();
  const raw = readFileSync(path, 'utf8');
  const tooBig = validateListsSize(raw);
  const errors = [...(tooBig ? [tooBig] : []), ...validateListsFile(JSON.parse(raw))];
  if (errors.length) throw new Error(`${path} is invalid:\n${errors.join('\n')}`);
  return new Response(raw, { headers: { 'content-type': 'application/json' } });
};
