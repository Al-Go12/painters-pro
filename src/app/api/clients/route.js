import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Client from '@/models/Client';

export async function GET(request) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const query = { userId };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }
  const LIMIT = 20;
  const page  = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const skip  = (page - 1) * LIMIT;

  const [clients, total] = await Promise.all([
    Client.find(query).sort({ createdAt: -1 }).skip(skip).limit(LIMIT),
    Client.countDocuments(query),
  ]);

  return NextResponse.json({
    clients,
    total,
    page,
    totalPages: Math.ceil(total / LIMIT),
    limit: LIMIT,
  });
}

export async function POST(request) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, mobile, email = '', company = '', gstNumber = '',
      clientType = 'individual', status = 'active', address = {} } = body;

    if (!String(name || '').trim()) {
      return NextResponse.json({ error: 'Client name is required.' }, { status: 400 });
    }
    const cleanMobile = String(mobile || '').trim();
    if (!/^\d{10}$/.test(cleanMobile)) {
      return NextResponse.json({ error: 'Mobile must be exactly 10 digits.' }, { status: 400 });
    }
    const cleanEmail = String(email || '').trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    await dbConnect();
    const client = await Client.create({
      userId,
      name: String(name).trim(),
      mobile: cleanMobile,
      email: cleanEmail,
      company: String(company).trim(),
      gstNumber: String(gstNumber).trim(),
      clientType,
      status,
      address: {
        line1:    String(address.line1 || '').trim(),
        line2:    String(address.line2 || '').trim(),
        pincode:  String(address.pincode || '').trim(),
        city:     String(address.city || '').trim(),
        district: String(address.district || '').trim(),
        state:    String(address.state || '').trim(),
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not create client.' }, { status: 500 });
  }
}
