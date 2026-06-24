import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Quotation from '@/models/Quotation';

async function getOwned(userId, id) {
  if (!isValidObjectId(id)) return null;
  return Quotation.findOne({ _id: id, userId }).populate('clientId', 'name mobile email address gstNumber company');
}

function calcDiscount(totalAmount, discountType, discountValue) {
  const v = Number(discountValue) || 0;
  const discountAmount = discountType === 'percent'
    ? Math.round(totalAmount * v) / 100
    : Math.min(v, totalAmount);
  return { discountAmount, grandTotal: Math.max(totalAmount - discountAmount, 0) };
}

export async function GET(request, { params }) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const quotation = await getOwned(userId, id);
  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ quotation });
}

export async function PUT(request, { params }) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const quotation = await getOwned(userId, id);
  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const { items, notes, status, interiorCalc, exteriorCalc, discountType, discountValue } = body;

  if (items !== undefined) {
    quotation.items       = items;
    quotation.totalAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  }
  if (notes        !== undefined) quotation.notes        = notes;
  if (status       !== undefined) quotation.status       = status;
  if (interiorCalc !== undefined) quotation.interiorCalc = interiorCalc;
  if (exteriorCalc !== undefined) quotation.exteriorCalc = exteriorCalc;
  if (discountType  !== undefined) quotation.discountType  = discountType;
  if (discountValue !== undefined) quotation.discountValue = discountValue;

  /* Recompute discount + grand total whenever relevant fields change */
  const { discountAmount, grandTotal } = calcDiscount(quotation.totalAmount, quotation.discountType, quotation.discountValue);
  quotation.discountAmount = discountAmount;
  quotation.grandTotal     = grandTotal;

  await quotation.save();
  return NextResponse.json({ quotation });
}

export async function DELETE(request, { params }) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const q = await Quotation.findOne({ _id: id, userId });
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await q.deleteOne();
  return NextResponse.json({ success: true });
}
