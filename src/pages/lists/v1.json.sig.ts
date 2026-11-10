import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { currentSnapshotPath } from '../../lib/snapshot';

// Ed25519 signature (base64) over the exact bytes of /lists/v1.json, made with the snapshot in sbtltv-lists.
export const GET: APIRoute = () => new Response(readFileSync(`${currentSnapshotPath()}.sig`, 'utf8'));
