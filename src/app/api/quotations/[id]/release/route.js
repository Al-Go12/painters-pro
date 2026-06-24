import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Quotation from '@/models/Quotation';

export async function POST(request, { params }) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await dbConnect();
  const quotation = await Quotation.findOne({ _id: id, userId })
    .populate('clientId', 'name mobile email address gstNumber company');
  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (quotation.releaseOrder) return NextResponse.json({ error: 'Already converted to a release order.' }, { status: 400 });

  const body = await request.json().catch(() => ({}));

  /* Auto-generate RO-YYYYMM-NNN */
  const now    = new Date();
  const prefix = `RO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
  const count  = await Quotation.countDocuments({
    userId,
    'releaseOrder.orderNumber': { $regex: `^${prefix}` },
  });
  const orderNumber = `${prefix}${String(count + 1).padStart(3, '0')}`;

  quotation.releaseOrder = {
    orderNumber,
    releasedAt: new Date(),
    notes: body.notes || '',
  };

  await quotation.save();
  return NextResponse.json({ quotation });
}
