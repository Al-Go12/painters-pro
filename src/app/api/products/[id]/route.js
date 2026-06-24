import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Product from '@/models/Product';

async function getOwned(userId, id) {
  if (!isValidObjectId(id)) return null;
  return Product.findOne({ _id: id, userId });
}

export async function PUT(request, { params }) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const product = await getOwned(userId, id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const { name, classification, productType, sizes } = await request.json();

  if (name           !== undefined) product.name           = String(name).trim();
  if (classification !== undefined) product.classification = classification;
  if (productType    !== undefined) product.productType    = productType;
  if (sizes          !== undefined) {
    const valid = (sizes || []).filter((s) => s.qty && Number(s.qty) > 0);
    if (!valid.length) return NextResponse.json({ error: 'At least one valid size is required.' }, { status: 400 });
    product.sizes = valid.map((s) => ({ qty: Number(s.qty), unit: s.unit || 'L', price: Number(s.price) || 0 }));
  }

  await product.save();
  return NextResponse.json({ product });
}

export async function DELETE(request, { params }) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const product = await getOwned(userId, id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  await product.deleteOne();
  return NextResponse.json({ success: true });
}
