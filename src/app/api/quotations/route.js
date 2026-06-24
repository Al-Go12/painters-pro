import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Quotation from '@/models/Quotation';

function totalAmount(items = []) {
  return items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
}

async function nextQuotationNumber(userId) {
  const now    = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `QT-${yyyymm}-`;
  const last   = await Quotation.findOne({ userId, quotationNumber: { $regex: `^${prefix}` } })
    .sort({ quotationNumber: -1 })
    .select('quotationNumber');
  const seq    = last ? (parseInt(last.quotationNumber.slice(-3), 10) || 0) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export async function GET(request) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  const filter = clientId ? { userId, clientId } : { userId };
  const quotations = await Quotation.find(filter)
    .sort({ createdAt: -1 })
    .populate('clientId', 'name mobile company');
  return NextResponse.json({ quotations });
}

export async function POST(request) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();
  const { clientId, items = [], notes = '', status = 'draft', interiorCalc, exteriorCalc, discountType = 'flat', discountValue = 0 } = body;

  if (!clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 });

  const quotationNumber = await nextQuotationNumber(userId);
  const total           = totalAmount(items);
  const dv              = Number(discountValue) || 0;
  const discountAmount  = discountType === 'percent' ? Math.round(total * dv) / 100 : Math.min(dv, total);
  const grandTotal      = Math.max(total - discountAmount, 0);

  const quotation = await Quotation.create({
    userId, clientId, quotationNumber, status,
    items, notes, totalAmount: total,
    discountType, discountValue: dv, discountAmount, grandTotal,
    interiorCalc: interiorCalc || null,
    exteriorCalc: exteriorCalc || null,
  });

  return NextResponse.json({ quotation }, { status: 201 });
}
