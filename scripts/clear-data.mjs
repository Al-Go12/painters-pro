/**
 * Deletes all clients and products from the database.
 * Keeps users intact.
 * Run: node scripts/clear-data.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually (no dotenv dependency needed)
function loadEnv(filePath) {
  const content = readFileSync(resolve(__dirname, '..', filePath), 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv('.env.local');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function main() {
  console.log('\nConnecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;

  const [clientsRes, productsRes] = await Promise.all([
    db.collection('clients').deleteMany({}),
    db.collection('products').deleteMany({}),
  ]);

  console.log(`✓ Deleted ${clientsRes.deletedCount} client(s)`);
  console.log(`✓ Deleted ${productsRes.deletedCount} product(s)`);
  console.log('\nDone. Users are untouched.\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
