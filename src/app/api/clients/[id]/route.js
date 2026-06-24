import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Client from '@/models/Client';

async function getOwnedClient(userId, clientId) {
  if (!isValidObjectId(clientId)) return null;
  return Client.findOne({ _id: clientId, userId });
}

export async function GET(request, { params }) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const client = await getOwnedClient(userId, id);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  return NextResponse.json({ client });
}

export async function PUT(request, { params }) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const client = await getOwnedClient(userId, id);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const p = await request.json();

  if (p.name !== undefined) {
    if (!String(p.name || '').trim()) {
      return NextResponse.json({ error: 'Client name is required.' }, { status: 400 });
    }
    client.name = String(p.name).trim();
  }
  if (p.mobile !== undefined) {
    const m = String(p.mobile || '').trim();
    if (!/^\d{10}$/.test(m)) {
      return NextResponse.json({ error: 'Mobile must be exactly 10 digits.' }, { status: 400 });
    }
    client.mobile = m;
  }
  if (p.email !== undefined) {
    const e = String(p.email || '').trim();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    client.email = e;
  }
  if (p.company    !== undefined) client.company    = String(p.company).trim();
  if (p.gstNumber  !== undefined) client.gstNumber  = String(p.gstNumber).trim();
  if (p.clientType !== undefined) client.clientType = p.clientType;
  if (p.status     !== undefined) client.status     = p.status;

  if (p.address !== undefined) {
    client.address = {
      line1:    String(p.address.line1 || '').trim(),
      line2:    String(p.address.line2 || '').trim(),
      pincode:  String(p.address.pincode || '').trim(),
      city:     String(p.address.city || '').trim(),
      district: String(p.address.district || '').trim(),
      state:    String(p.address.state || '').trim(),
    };
  }

  await client.save();
  return NextResponse.json({ client });
}

export async function DELETE(request, { params }) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const client = await getOwnedClient(userId, id);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  await client.deleteOne();
  return NextResponse.json({ success: true });
}
