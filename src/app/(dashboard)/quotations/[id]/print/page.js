'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';

const fmtINR = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PrintPage({ params }) {
  const { id }       = use(params);
  const searchParams = useSearchParams();
  const isRelease    = searchParams.get('type') === 'release';

  const [quotation, setQuotation] = useState(null);
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [qRes, uRes] = await Promise.all([
          fetch(`/api/quotations/${id}`),
          fetch('/api/auth/me'),
        ]);
        if (!qRes.ok) { setError('Quotation not found.'); setLoading(false); return; }
        const qData = await qRes.json();
        const uData = uRes.ok ? await uRes.json() : {};
        setQuotation(qData.quotation);
        setUser(uData.user || null);
      } catch {
        setError('Failed to load quotation.');
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !quotation) {
    return <div className="p-8 text-red-600 font-semibold">{error || 'Not found.'}</div>;
  }

  const client     = quotation.clientId || {};
  const ro         = quotation.releaseOrder;
  const docType    = isRelease && ro ? 'RELEASE ORDER' : 'QUOTATION';
  const docNumber  = isRelease && ro ? ro.orderNumber  : quotation.quotationNumber;
  const docDate    = isRelease && ro ? ro.releasedAt    : quotation.createdAt;
  const addr       = [client.address?.area, client.address?.city, client.address?.state, client.address?.pincode].filter(Boolean).join(', ');

  const totalAmount   = quotation.totalAmount   || 0;
  const discountValue = quotation.discountValue || 0;
  const discountType  = quotation.discountType  || 'flat';
  const discountAmt   = quotation.discountAmount || 0;
  const grandTotal    = quotation.grandTotal     || totalAmount;

  return (
    <>
      {/* Print controls — hidden when printing */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()}
            className="text-gray-500 hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-bold text-gray-700 text-sm">{docType} — {docNumber}</span>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#C8102E] text-white text-sm font-bold rounded-xl hover:bg-[#a00d25] transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      {/* Print document */}
      <div className="print-doc">
        {/* ── Header ── */}
        <div className="doc-header">
          <div className="brand-block">
            <div className="brand-name">PainterPro</div>
            <div className="brand-sub">Authorized Nippon Paint Dealer</div>
            {user?.email && <div className="brand-contact">{user.email}</div>}
          </div>
          <div className="doc-title-block">
            <div className="doc-type">{docType}</div>
            <div className="doc-meta">
              <div><span className="meta-label">Number:</span> <strong>{docNumber}</strong></div>
              <div><span className="meta-label">Date:</span> {fmtDate(docDate)}</div>
              {isRelease && ro && (
                <div><span className="meta-label">Quotation Ref:</span> {quotation.quotationNumber}</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Red divider ── */}
        <div className="red-divider" />

        {/* ── Client info ── */}
        <div className="client-section">
          <div className="section-label">Bill To</div>
          <div className="client-name">{client.name || '—'}</div>
          {client.company   && <div className="client-detail">{client.company}</div>}
          {client.mobile    && <div className="client-detail">📞 {client.mobile}</div>}
          {client.email     && <div className="client-detail">✉ {client.email}</div>}
          {addr             && <div className="client-detail">{addr}</div>}
          {client.gstNumber && <div className="client-detail">GSTIN: {client.gstNumber}</div>}
        </div>

        {/* ── Items table ── */}
        <table className="items-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-product">Product</th>
              <th className="col-size">Pack Size</th>
              <th className="col-qty">Qty</th>
              {quotation.items?.some((i) => i.colourHex) && <th className="col-colour">Colour</th>}
              <th className="col-price">Unit Price</th>
              <th className="col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(quotation.items || []).map((item, i) => (
              <tr key={i} className={i % 2 === 1 ? 'row-alt' : ''}>
                <td className="col-num">{i + 1}</td>
                <td className="col-product">
                  <div className="product-name">{item.productName}</div>
                </td>
                <td className="col-size">
                  {item.size ? `${item.size.qty}${item.size.unit}` : '—'}
                </td>
                <td className="col-qty">{item.quantity}</td>
                {quotation.items?.some((x) => x.colourHex) && (
                  <td className="col-colour">
                    {item.colourHex ? (
                      <span className="colour-chip" style={{ background: item.colourHex }}>&nbsp;&nbsp;&nbsp;&nbsp;</span>
                    ) : '—'}
                  </td>
                )}
                <td className="col-price">{item.size?.price ? `₹${fmtINR(item.size.price)}` : '—'}</td>
                <td className="col-amount">{item.amount ? `₹${fmtINR(item.amount)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Totals ── */}
        <div className="totals-section">
          <div className="total-row">
            <span>Subtotal</span>
            <span>₹{fmtINR(totalAmount)}</span>
          </div>
          {discountAmt > 0 && (
            <div className="total-row discount-row">
              <span>Discount {discountType === 'percent' ? `(${discountValue}%)` : '(Flat)'}</span>
              <span>− ₹{fmtINR(discountAmt)}</span>
            </div>
          )}
          <div className="total-row grand-row">
            <span>Grand Total</span>
            <span>₹{fmtINR(grandTotal)}</span>
          </div>
        </div>

        {/* ── Notes ── */}
        {quotation.notes && (
          <div className="notes-section">
            <div className="section-label">Notes</div>
            <div className="notes-body">{quotation.notes}</div>
          </div>
        )}
        {isRelease && ro?.notes && (
          <div className="notes-section">
            <div className="section-label">Release Notes</div>
            <div className="notes-body">{ro.notes}</div>
          </div>
        )}

        {/* ── Signature ── */}
        <div className="signature-section">
          <div className="sig-box">
            <div className="sig-line" />
            <div className="sig-label">Customer Signature</div>
          </div>
          <div className="sig-box">
            <div className="sig-line" />
            <div className="sig-label">Authorized Signature</div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="doc-footer">
          <div className="footer-red-bar" />
          <div className="footer-text">Thank you for your business! · Generated by PainterPro</div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { font-family: 'Inter', sans-serif; background: #f5f5f5; }

        .print-doc {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 72px auto 40px;
          padding: 12mm 14mm;
          box-shadow: 0 4px 32px rgba(0,0,0,0.12);
        }

        /* ── Header ── */
        .doc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6mm;
        }
        .brand-name {
          font-size: 22px;
          font-weight: 900;
          color: #C8102E;
          letter-spacing: -0.5px;
        }
        .brand-sub {
          font-size: 10px;
          color: #888;
          margin-top: 2px;
          font-weight: 500;
        }
        .brand-contact {
          font-size: 10px;
          color: #aaa;
          margin-top: 2px;
        }
        .doc-title-block { text-align: right; }
        .doc-type {
          font-size: 20px;
          font-weight: 900;
          color: #1a1a1a;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .doc-meta { font-size: 11px; color: #555; line-height: 1.7; }
        .meta-label { color: #aaa; }

        /* ── Red divider ── */
        .red-divider {
          height: 3px;
          background: linear-gradient(90deg, #C8102E 60%, #F47920 100%);
          border-radius: 2px;
          margin-bottom: 6mm;
        }

        /* ── Client info ── */
        .client-section { margin-bottom: 6mm; }
        .section-label {
          font-size: 9px;
          font-weight: 700;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 4px;
        }
        .client-name {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 3px;
        }
        .client-detail { font-size: 11px; color: #555; line-height: 1.7; }

        /* ── Items table ── */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6mm;
          font-size: 11px;
        }
        .items-table thead tr {
          background: #C8102E;
          color: white;
        }
        .items-table thead th {
          padding: 8px 10px;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: left;
        }
        .items-table tbody td {
          padding: 7px 10px;
          color: #333;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
        }
        .row-alt td { background: #fafafa; }
        .col-num    { width: 28px; text-align: center; color: #aaa; }
        .col-size   { width: 60px; text-align: center; }
        .col-qty    { width: 36px; text-align: center; }
        .col-colour { width: 52px; text-align: center; }
        .col-price  { width: 80px; text-align: right; }
        .col-amount { width: 90px; text-align: right; font-weight: 700; }
        .product-name { font-weight: 600; color: #1a1a1a; }
        .colour-chip {
          display: inline-block;
          width: 18px;
          height: 14px;
          border-radius: 3px;
          border: 1px solid rgba(0,0,0,0.1);
        }

        /* ── Totals ── */
        .totals-section {
          margin-left: auto;
          width: 220px;
          margin-bottom: 6mm;
          font-size: 12px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          color: #555;
          border-bottom: 1px solid #f0f0f0;
        }
        .discount-row { color: #C8102E; }
        .grand-row {
          font-size: 15px;
          font-weight: 900;
          color: #1a1a1a;
          padding-top: 8px;
          border-bottom: 2px solid #C8102E;
          margin-top: 2px;
        }

        /* ── Notes ── */
        .notes-section { margin-bottom: 6mm; }
        .notes-body {
          font-size: 11px;
          color: #555;
          line-height: 1.7;
          padding: 8px 10px;
          background: #fafafa;
          border-left: 3px solid #C8102E;
          border-radius: 2px;
          margin-top: 4px;
          white-space: pre-wrap;
        }

        /* ── Signature ── */
        .signature-section {
          display: flex;
          gap: 40mm;
          margin-top: 16mm;
          margin-bottom: 8mm;
        }
        .sig-box { flex: 1; }
        .sig-line {
          height: 1px;
          background: #ccc;
          margin-bottom: 6px;
        }
        .sig-label {
          font-size: 10px;
          color: #aaa;
          font-weight: 500;
        }

        /* ── Footer ── */
        .doc-footer { margin-top: auto; }
        .footer-red-bar {
          height: 2px;
          background: linear-gradient(90deg, #C8102E 60%, #F47920 100%);
          margin-bottom: 6px;
          border-radius: 1px;
        }
        .footer-text {
          font-size: 9px;
          color: #bbb;
          text-align: center;
          letter-spacing: 0.5px;
        }

        /* ── Print media ── */
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-doc {
            margin: 0;
            padding: 10mm 12mm;
            box-shadow: none;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
