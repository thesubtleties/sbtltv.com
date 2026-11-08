// Signs lists/v1.json with the private key that lives only on the maintainer's machine.
// pnpm sign-lists  (key: ~/.config/sbtltv-lists/signing-key.pem, or SBTLTV_LISTS_KEY=/path)
import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const keyPath = process.env.SBTLTV_LISTS_KEY ?? `${homedir()}/.config/sbtltv-lists/signing-key.pem`;
const body = readFileSync('lists/v1.json');
JSON.parse(body.toString('utf8')); // refuse to sign something that isn't JSON (full rules run in the build)
const sig = sign(null, body, createPrivateKey(readFileSync(keyPath)));
if (!verify(null, body, createPublicKey(readFileSync('lists/public-key.pem')), sig)) {
  console.error('the private key does not match lists/public-key.pem');
  process.exit(1);
}
writeFileSync('lists/v1.json.sig', sig.toString('base64') + '\n');
console.log('signed lists/v1.json');
