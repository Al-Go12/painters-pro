import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Quotation from '@/models/Quotation';

export async function POST(request, { params }) {
  const userId = requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token         = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return NextResponse.json({ error: 'WhatsApp API is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env.local.' }, { status: 501 });
  }

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const { phone, pdfBase64, filename = 'Quotation.pdf' } = body;
  if (!phone || !pdfBase64) return NextResponse.json({ error: 'phone and pdfBase64 are required' }, { status: 400 });

  /* Normalise phone → 91XXXXXXXXXX */
  const digits  = phone.replace(/\D/g, '');
  const waPhone = digits.startsWith('91') ? digits : `91${digits}`;
  if (waPhone.length < 12) return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });

  await dbConnect();
  const q = await Quotation.findOne({ _id: id, userId });
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  /* ── Upload PDF to WhatsApp Media API ── */
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  const formData  = new FormData();
  formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), filename);
  formData.append('messaging_product', 'whatsapp');
  formData.append('type', 'application/pdf');

  const uploadRes = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/media`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData },
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    return NextResponse.json({ error: err?.error?.message || `Media upload failed (${uploadRes.status}).` }, { status: 502 });
  }

  const { id: mediaId } = await uploadRes.json();

  /* ── Send document message ── */
  const msgRes = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: waPhone,
        type: 'document',
        document: {
          id: mediaId,
          filename,
          caption: `Your ${filename.includes('Release') ? 'Release Order' : 'Quotation'} from PainterPro`,
        },
      }),
    },
  );

  if (!msgRes.ok) {
    const err = await msgRes.json().catch(() => ({}));
    return NextResponse.json({ error: err?.error?.message || `Message send failed (${msgRes.status}).` }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
