'use client';

const fmtINR = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

/**
 * Shared print layout — used by QuotationBuilder (react-to-print)
 * and ClientDetailPage (react-to-print).
 *
 * Props:
 *   forwardRef  – ref passed from useReactToPrint's contentRef
 *   quotation   – full quotation object (items, totals, notes, releaseOrder, …)
 *   client      – full client object (name, mobile, email, address, gstNumber, company)
 *   isRelease   – render as Release Order view when true
 */
export default function PrintLayout({ forwardRef, quotation, client, isRelease = false }) {
  const ro      = quotation?.releaseOrder;
  const docType = isRelease && ro ? 'RELEASE ORDER' : 'QUOTATION';
  const docNum  = isRelease && ro ? ro.orderNumber   : quotation?.quotationNumber;
  const docDate = isRelease && ro ? ro.releasedAt    : quotation?.createdAt;

  const addr         = [client?.address?.area, client?.address?.city, client?.address?.state, client?.address?.pincode].filter(Boolean).join(', ');
  const items        = quotation?.items        || [];
  const totalAmount  = quotation?.totalAmount  || 0;
  const discountAmt  = quotation?.discountAmount || 0;
  const discountType = quotation?.discountType || 'flat';
  const discountVal  = quotation?.discountValue || 0;
  const grandTotal   = quotation?.grandTotal   || totalAmount;
  const notes        = quotation?.notes        || '';
  const roNotes      = ro?.notes               || '';

  return (
    <div ref={forwardRef} style={{ fontFamily: 'Arial, sans-serif', padding: '10mm 12mm', width: '190mm', color: '#222' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5mm' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#C8102E', letterSpacing: '-0.5px' }}>PainterPro</div>
          <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Authorized Nippon Paint Dealer</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a', letterSpacing: 1, textTransform: 'uppercase' }}>{docType}</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 4, lineHeight: 1.7 }}>
            <div><span style={{ color: '#aaa' }}>Number:</span> <strong>{docNum || '—'}</strong></div>
            <div><span style={{ color: '#aaa' }}>Date:</span> {fmtDate(docDate)}</div>
            {isRelease && ro && <div><span style={{ color: '#aaa' }}>Quotation Ref:</span> {quotation?.quotationNumber}</div>}
          </div>
        </div>
      </div>

      {/* ── Red divider ── */}
      <div style={{ height: 3, background: 'linear-gradient(90deg,#C8102E 60%,#F47920 100%)', borderRadius: 2, marginBottom: '5mm' }} />

      {/* ── Client ── */}
      <div style={{ marginBottom: '5mm' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Bill To</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{client?.name || '—'}</div>
        {client?.company   && <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>{client.company}</div>}
        {client?.mobile    && <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>Tel: {client.mobile}</div>}
        {client?.email     && <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>{client.email}</div>}
        {addr              && <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>{addr}</div>}
        {client?.gstNumber && <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>GSTIN: {client.gstNumber}</div>}
      </div>

      {/* ── Items table ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm', fontSize: 11 }}>
        <thead>
          <tr style={{ background: '#C8102E', color: '#fff' }}>
            {['#', 'Product', 'Pack Size', 'Qty', 'Unit Price', 'Amount'].map((h) => (
              <th key={h} style={{
                padding: '7px 9px',
                textAlign: (h === 'Unit Price' || h === 'Amount') ? 'right' : (h === '#' || h === 'Qty') ? 'center' : 'left',
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} style={{ background: i % 2 === 1 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '7px 9px', textAlign: 'center', color: '#aaa' }}>{i + 1}</td>
              <td style={{ padding: '7px 9px', fontWeight: 600 }}>{it.productName}</td>
              <td style={{ padding: '7px 9px', textAlign: 'center' }}>{it.size ? `${it.size.qty}${it.size.unit}` : '—'}</td>
              <td style={{ padding: '7px 9px', textAlign: 'center' }}>{it.quantity}</td>
              <td style={{ padding: '7px 9px', textAlign: 'right' }}>{it.size?.price ? `₹${fmtINR(it.size.price)}` : '—'}</td>
              <td style={{ padding: '7px 9px', textAlign: 'right', fontWeight: 700 }}>{it.amount ? `₹${fmtINR(it.amount)}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Totals ── */}
      <div style={{ marginLeft: 'auto', width: 230, marginBottom: '5mm', fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f0f0f0', color: '#555' }}>
          <span>Subtotal</span><span>₹{fmtINR(totalAmount)}</span>
        </div>
        {discountAmt > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f0f0f0', color: '#C8102E' }}>
            <span>Discount {discountType === 'percent' ? `(${discountVal}%)` : '(Flat)'}</span>
            <span>−₹{fmtINR(discountAmt)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 15, fontWeight: 900, color: '#1a1a1a', borderBottom: '2px solid #C8102E', marginTop: 2 }}>
          <span>Grand Total</span><span>₹{fmtINR(grandTotal)}</span>
        </div>
      </div>

      {/* ── Notes ── */}
      {notes && (
        <div style={{ marginBottom: '4mm' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 11, color: '#555', padding: '7px 10px', background: '#fafafa', borderLeft: '3px solid #C8102E', borderRadius: 2, whiteSpace: 'pre-wrap' }}>{notes}</div>
        </div>
      )}
      {isRelease && roNotes && (
        <div style={{ marginBottom: '4mm' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Release Notes</div>
          <div style={{ fontSize: 11, color: '#555', padding: '7px 10px', background: '#fafafa', borderLeft: '3px solid #C8102E', borderRadius: 2, whiteSpace: 'pre-wrap' }}>{roNotes}</div>
        </div>
      )}

      {/* ── Signatures ── */}
      <div style={{ display: 'flex', gap: '40mm', marginTop: '16mm', marginBottom: '8mm' }}>
        {['Customer Signature', 'Authorized Signature'].map((label) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ height: 1, background: '#ccc', marginBottom: 6 }} />
            <div style={{ fontSize: 10, color: '#aaa' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{ height: 2, background: 'linear-gradient(90deg,#C8102E 60%,#F47920 100%)', borderRadius: 1, marginBottom: 6 }} />
      <div style={{ fontSize: 9, color: '#bbb', textAlign: 'center', letterSpacing: 0.5 }}>Thank you for your business! · Generated by PainterPro</div>
    </div>
  );
}
