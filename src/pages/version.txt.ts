import type { APIRoute } from 'astro';
import { getRelease } from '../lib/release';

export const GET: APIRoute = async () => new Response(`${(await getRelease()).tag}\n`);
