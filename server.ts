import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bundledServer = path.join(__dirname, 'server.bundle.js');

if (fs.existsSync(bundledServer)) {
  await import('./server.bundle.js');
} else {
  await import('./server/app.ts');
}
