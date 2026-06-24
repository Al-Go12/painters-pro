'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { useToast, ToastContainer } from '@/components/Toast';
import PrintLayout from '@/components/PrintLayout';
import WhatsAppSendModal from '@/components/WhatsAppSendModal';

const fmtINR  = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${status === 'saved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
      {status === 'saved' ? 'Saved' : 'Draft'}
    </span>
  );
}

export default function QuotationsPage() {
  const router = useRouter();
  const { toasts, toast, dismiss } = useToast();

  const [quotations,   setQuotations]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [deleteId,     setDeleteId]     = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [convertId,    setConvertId]    = useState(null);
  const [converting,   setConverting]   = useState(false);
  const [printItem,    setPrintItem]    = useState(null); // { quotation, client, isRelease }
  const [whatsappItem, setWhatsappItem] = useState(null); // { quotation, client, isRelease }

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printItem?.quotation?.releaseOrder?.orderNumber || printItem?.quotation?.quotationNumber || 'Document',
    pageStyle: `@page { size: A4; margin: 10mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`,
    onAfterPrint: () => setPrintItem(null),
  });

  useEffect(() => {
    if (printItem) handlePrint();
  }, [printItem]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/quotations');
        if (res.status === 401) { router.push('/login'); return; }
        const data = await res.json();
        setQuotations(data.quotations || []);
      } catch {}
      setLoading(false);
    }
    load();
  }, [router]);

  async function deleteQuotation() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/quotations/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || 'Failed to delete.', 'error');
        return;
      }
      toast('Quotation deleted.');
      setQuotations((prev) => prev.filter((q) => q._id !== deleteId));
    } catch {
      toast('Network error.', 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  async function convertToRelease(qId) {
    setConverting(true);
    try {
      const res  = await fetch(`/api/quotations/${qId}/release`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json();
      if (!res.ok) { toast(data.error || 'Failed to convert.', 'error'); return; }
      toast(`Converted to ${data.quotation.releaseOrder.orderNumber}`);
      setQuotations((prev) => prev.map((q) => q._id === qId ? { ...q, releaseOrder: data.quotation.releaseOrder } : q));
      setConvertId(null);
    } catch { toast('Network error.', 'error'); }
    finally { setConverting(false); }
  }

  const clientOf = (q) => typeof q.clientId === 'object' ? q.clientId : null;
  const clientName = (q) => clientOf(q)?.name || '—';

  const WA_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
  const PRINT_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-np-text)]">Quotations</h1>
          <p className="text-sm text-[var(--color-np-muted)] mt-0.5">
            {loading ? 'Loading…' : `${quotations.length} quotation${quotations.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => router.push('/clients')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-np-red)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-np-red-dark)] transition-colors shadow-sm self-start sm:self-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Quotation
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[var(--color-np-red-light)] border-t-[var(--color-np-red)] rounded-full animate-spin" />
        </div>
      ) : quotations.length === 0 ? (
        <div className="flex-1 bg-white rounded-2xl border border-[var(--color-np-border)] flex flex-col items-center justify-center gap-3 py-20">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-np-gray)] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[var(--color-np-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-[var(--color-np-text)] font-semibold">No quotations yet</p>
          <p className="text-sm text-[var(--color-np-muted)]">Select a client and create a quotation to get started.</p>
          <button onClick={() => router.push('/clients')}
            className="mt-1 px-4 py-2 bg-[var(--color-np-red)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-np-red-dark)] transition-colors">
            Go to Clients
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--color-np-border)] shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-np-border)] bg-[var(--color-np-gray)]">
                  {['Quotation #', 'Client', 'Date', 'Items', 'Total', 'Status / RO', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-[var(--color-np-muted)] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-np-border)]">
                {quotations.map((q) => {
                  const cl = clientOf(q);
                  const isRelease = !!q.releaseOrder;
                  return (
                    <tr key={q._id} className="hover:bg-[var(--color-np-cream)] transition-colors">
                      <td className="px-4 py-3.5 font-bold text-[var(--color-np-text)]">{q.quotationNumber}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => router.push(`/clients/${typeof q.clientId === 'object' ? q.clientId._id : q.clientId}`)}
                          className="font-semibold text-[var(--color-np-text)] hover:text-[var(--color-np-red)] transition-colors text-left">
                          {clientName(q)}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--color-np-muted)]">{fmtDate(q.createdAt)}</td>
                      <td className="px-4 py-3.5 text-[var(--color-np-muted)]">{q.items?.length || 0}</td>
                      <td className="px-4 py-3.5 font-bold text-[var(--color-np-text)]">₹{fmtINR(q.grandTotal || q.totalAmount)}</td>
                      <td className="px-4 py-3.5">
                        {isRelease
                          ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{q.releaseOrder.orderNumber}</span>
                          : <StatusBadge status={q.status} />
                        }
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {cl?.mobile && (
                            <button onClick={() => setWhatsappItem({ quotation: q, client: cl, isRelease })}
                              title="Send via WhatsApp" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                              {WA_ICON}
                            </button>
                          )}
                          <button onClick={() => setPrintItem({ quotation: q, client: cl, isRelease })}
                            title="Print" className="p-1.5 rounded-lg text-[var(--color-np-muted)] hover:bg-[var(--color-np-gray)] transition-colors">
                            {PRINT_ICON}
                          </button>
                          <button onClick={() => router.push(`/quotations/${q._id}`)}
                            className="px-3 py-1.5 text-xs font-semibold text-[var(--color-np-red)] border border-[var(--color-np-red)] rounded-lg hover:bg-[var(--color-np-red)] hover:text-white transition-colors">
                            Open
                          </button>
                          {!isRelease && (
                            <button onClick={() => setConvertId(q._id)}
                              className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-600 hover:text-white transition-colors whitespace-nowrap">
                              → RO
                            </button>
                          )}
                          <button onClick={() => setDeleteId(q._id)}
                            className="p-1.5 rounded-lg text-[var(--color-np-muted)] hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[var(--color-np-border)]">
            {quotations.map((q) => {
              const cl = clientOf(q);
              const isRelease = !!q.releaseOrder;
              return (
                <div key={q._id} className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-bold text-[var(--color-np-text)]">{q.quotationNumber}</p>
                      <p className="text-sm font-semibold text-[var(--color-np-red)] mt-0.5">{clientName(q)}</p>
                      <p className="text-xs text-[var(--color-np-muted)] mt-0.5">{fmtDate(q.createdAt)}</p>
                    </div>
                    {isRelease
                      ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{q.releaseOrder.orderNumber}</span>
                      : <StatusBadge status={q.status} />
                    }
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-xs text-[var(--color-np-muted)]">{q.items?.length || 0} items</p>
                      <p className="font-bold text-[var(--color-np-text)]">₹{fmtINR(q.grandTotal || q.totalAmount)}</p>
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {cl?.mobile && (
                        <button onClick={() => setWhatsappItem({ quotation: q, client: cl, isRelease })}
                          className="p-2 rounded-lg text-green-600 border border-green-200 hover:bg-green-50">
                          {WA_ICON}
                        </button>
                      )}
                      <button onClick={() => setPrintItem({ quotation: q, client: cl, isRelease })}
                        className="p-2 rounded-lg text-[var(--color-np-muted)] border border-[var(--color-np-border)] hover:bg-[var(--color-np-gray)]">
                        {PRINT_ICON}
                      </button>
                      <button onClick={() => router.push(`/quotations/${q._id}`)}
                        className="px-3 py-1.5 text-xs font-semibold text-[var(--color-np-red)] border border-[var(--color-np-red)] rounded-lg hover:bg-[var(--color-np-red)] hover:text-white transition-colors">
                        Open
                      </button>
                      <button onClick={() => setDeleteId(q._id)}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Convert to Release Order confirm */}
      {convertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-np-text)] mb-2">Convert to Release Order?</h3>
            <p className="text-sm text-[var(--color-np-muted)] mb-6">A unique RO number will be assigned. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConvertId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--color-np-border)] text-sm font-semibold text-[var(--color-np-text)] hover:bg-[var(--color-np-gray)] transition-colors">
                Cancel
              </button>
              <button onClick={() => convertToRelease(convertId)} disabled={converting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {converting ? 'Converting…' : 'Convert'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-np-text)] mb-2">Delete Quotation</h3>
            <p className="text-sm text-[var(--color-np-muted)] mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--color-np-border)] text-sm font-semibold text-[var(--color-np-text)] hover:bg-[var(--color-np-gray)] transition-colors">
                Cancel
              </button>
              <button onClick={deleteQuotation} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print content — used by react-to-print */}
      {printItem && (
        <div style={{ display: 'none' }}>
          <PrintLayout
            forwardRef={printRef}
            quotation={printItem.quotation}
            client={printItem.client}
            isRelease={printItem.isRelease}
          />
        </div>
      )}

      {/* WhatsApp send modal */}
      {whatsappItem && (
        <WhatsAppSendModal
          quotation={whatsappItem.quotation}
          client={whatsappItem.client}
          isRelease={whatsappItem.isRelease}
          onClose={() => setWhatsappItem(null)}
          onSent={() => toast('WhatsApp message sent!')}
        />
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
