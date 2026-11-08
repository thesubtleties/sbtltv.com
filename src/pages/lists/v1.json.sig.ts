import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';

// Ed25519 signature (base64) over the exact bytes of /lists/v1.json; made locally with pnpm sign-lists.
export const GET: APIRoute = () => new Response(readFileSync('lists/v1.json.sig', 'utf8'));
