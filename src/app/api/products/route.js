import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Product from '@/models/Product';

export async function GET(request) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const classification = searchParams.get('classification');
  const productType    = searchParams.get('productType');

  const search = searchParams.get('search') || '';

  const query = { userId };
  if (classification && classification !== 'all') query.classification = classification;
  if (productType    && productType    !== 'all') query.productType    = productType;
  if (search) query.name = { $regex: search, $options: 'i' };

  const LIMIT = 20;
  const page  = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const skip  = (page - 1) * LIMIT;

  const [products, total] = await Promise.all([
    Product.find(query).sort({ classification: 1, name: 1 }).skip(skip).limit(LIMIT),
    Product.countDocuments(query),
  ]);

  return NextResponse.json({
    products,
    total,
    page,
    totalPages: Math.ceil(total / LIMIT),
    limit: LIMIT,
  });
}

export async function POST(request) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { name, classification, productType, sizes } = await request.json();

  if (!String(name || '').trim()) {
    return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
  }
  const validSizes = (sizes || []).filter((s) => s.qty && Number(s.qty) > 0);
  if (!validSizes.length) {
    return NextResponse.json({ error: 'At least one size with a valid quantity is required.' }, { status: 400 });
  }

  const product = await Product.create({
    userId,
    name:           String(name).trim(),
    classification: classification || 'interior',
    productType:    productType    || 'wall emulsion',
    sizes: validSizes.map((s) => ({ qty: Number(s.qty), unit: s.unit || 'L', price: Number(s.price) || 0 })),
  });

  return NextResponse.json({ product }, { status: 201 });
}
