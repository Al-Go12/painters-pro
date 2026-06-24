/**
 * Seeds 10 Nippon Paint products (interior + exterior) for the first user.
 * Skips any product whose name already exists for that user.
 *
 * Run: node scripts/seed-products.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

/* ── Schemas (inline, no ESM import issues) ── */
const SizeSchema = new mongoose.Schema(
  { qty: Number, unit: { type: String, default: 'L' }, price: { type: Number, default: 0 } },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:           { type: String, required: true, trim: true },
    classification: { type: String, enum: ['interior', 'exterior', 'both'], default: 'interior' },
    productType:    { type: String, enum: ['primer', 'wall emulsion', 'ceiling paint', 'waterproof', 'putty', 'texture', 'enamel', 'distemper'], default: 'wall emulsion' },
    sizes:          { type: [SizeSchema], default: [] },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  { email: String, password: String, name: String },
  { timestamps: true }
);

/* ── Product catalogue ── */
const PRODUCTS = [
  /* ── INTERIOR ─────────────────────────────────────────────── */
  {
    name:           'Nippon Vinilex 5000',
    classification: 'interior',
    productType:    'wall emulsion',
    sizes: [
      { qty: 1,  unit: 'L',  price: 210  },
      { qty: 4,  unit: 'L',  price: 790  },
      { qty: 10, unit: 'L',  price: 1850 },
      { qty: 20, unit: 'L',  price: 3550 },
    ],
  },
  {
    name:           'Nippon Matex Gold',
    classification: 'interior',
    productType:    'wall emulsion',
    sizes: [
      { qty: 1,  unit: 'L',  price: 280  },
      { qty: 4,  unit: 'L',  price: 1050 },
      { qty: 10, unit: 'L',  price: 2400 },
      { qty: 20, unit: 'L',  price: 4600 },
    ],
  },
  {
    name:           'Nippon Ceiling White',
    classification: 'interior',
    productType:    'ceiling paint',
    sizes: [
      { qty: 1,  unit: 'L',  price: 180  },
      { qty: 4,  unit: 'L',  price: 680  },
      { qty: 10, unit: 'L',  price: 1600 },
    ],
  },
  {
    name:           'Nippon Sealex Interior Primer',
    classification: 'interior',
    productType:    'primer',
    sizes: [
      { qty: 1,  unit: 'L',  price: 150  },
      { qty: 4,  unit: 'L',  price: 560  },
      { qty: 10, unit: 'L',  price: 1300 },
      { qty: 20, unit: 'L',  price: 2450 },
    ],
  },
  {
    name:           'Nippon Odour-less Premium',
    classification: 'interior',
    productType:    'wall emulsion',
    sizes: [
      { qty: 1,  unit: 'L',  price: 350  },
      { qty: 4,  unit: 'L',  price: 1320 },
      { qty: 10, unit: 'L',  price: 3100 },
    ],
  },

  /* ── EXTERIOR ──────────────────────────────────────────────── */
  {
    name:           'Nippon WeatherBond Advance',
    classification: 'exterior',
    productType:    'wall emulsion',
    sizes: [
      { qty: 1,  unit: 'L',  price: 320  },
      { qty: 4,  unit: 'L',  price: 1200 },
      { qty: 10, unit: 'L',  price: 2800 },
      { qty: 20, unit: 'L',  price: 5400 },
    ],
  },
  {
    name:           'Nippon Weathergard Plus',
    classification: 'exterior',
    productType:    'wall emulsion',
    sizes: [
      { qty: 1,  unit: 'L',  price: 390  },
      { qty: 4,  unit: 'L',  price: 1460 },
      { qty: 10, unit: 'L',  price: 3400 },
    ],
  },
  {
    name:           'Nippon Exterior Sealer Primer',
    classification: 'exterior',
    productType:    'primer',
    sizes: [
      { qty: 1,  unit: 'L',  price: 170  },
      { qty: 4,  unit: 'L',  price: 640  },
      { qty: 10, unit: 'L',  price: 1500 },
      { qty: 20, unit: 'L',  price: 2800 },
    ],
  },
  {
    name:           'Nippon Aquacoat Terrace Coat',
    classification: 'exterior',
    productType:    'waterproof',
    sizes: [
      { qty: 1,  unit: 'L',  price: 420  },
      { qty: 4,  unit: 'L',  price: 1580 },
      { qty: 10, unit: 'L',  price: 3700 },
    ],
  },

  /* ── BOTH ──────────────────────────────────────────────────── */
  {
    name:           'Nippon 881 Acrylic Wall Putty',
    classification: 'both',
    productType:    'putty',
    sizes: [
      { qty: 5,  unit: 'Kg', price: 480  },
      { qty: 10, unit: 'Kg', price: 920  },
      { qty: 20, unit: 'Kg', price: 1750 },
      { qty: 40, unit: 'Kg', price: 3200 },
    ],
  },
];

async function main() {
  console.log('\nConnecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);

  const User    = mongoose.models.User    || mongoose.model('User',    UserSchema);
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

  const user = await User.findOne({});
  if (!user) {
    console.error('No user found. Run the auth seed first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Seeding products for user: ${user.email}\n`);

  let inserted = 0;
  let skipped  = 0;

  for (const p of PRODUCTS) {
    const exists = await Product.findOne({ userId: user._id, name: p.name });
    if (exists) {
      console.log(`  skip  ${p.name}`);
      skipped++;
      continue;
    }
    await Product.create({ ...p, userId: user._id });
    console.log(`  ✓ ${p.classification.padEnd(8)} [${p.productType.padEnd(14)}]  ${p.name}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}  Skipped (already exists): ${skipped}\n`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
