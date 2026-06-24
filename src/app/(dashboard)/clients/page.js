'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ClientForm from '@/components/ClientForm';
import Pagination from '@/components/Pagination';
import { useToast, ToastContainer } from '@/components/Toast';

const LIMIT = 20;

/* ── Debounce hook ── */
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Badges ── */
function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
}

function TypeBadge({ type }) {
  const cls   = { individual: 'bg-blue-50 text-blue-700', business: 'bg-purple-50 text-purple-700', contractor: 'bg-orange-50 text-orange-700' };
  const label = { individual: 'Individual', business: 'Business', contractor: 'Contractor' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls[type] || cls.individual}`}>
      {label[type] || type}
    </span>
  );
}

/* ── Client Modal ── */
function ClientModal({ client, onClose, onSaved }) {
  const isEdit = !!client;
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88dvh]">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-np-border)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-np-text)]">{isEdit ? 'Edit Client' : 'New Client'}</h2>
            {isEdit && client?.name && <p className="text-xs text-[var(--color-np-muted)] mt-0.5">{client.name}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--color-np-muted)] hover:text-[var(--color-np-text)] hover:bg-[var(--color-np-gray)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ClientForm initialData={client} clientId={client?._id}
            onSuccess={(saved) => { onSaved(saved, isEdit); onClose(); }}
            onCancel={onClose} />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-np-border)] bg-[var(--color-np-gray)] flex-shrink-0">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[var(--color-np-border)] text-sm font-semibold text-[var(--color-np-text)] hover:bg-white transition-colors">
            Cancel
          </button>
          <button type="submit" form="client-form"
            className="px-6 py-2.5 rounded-xl bg-[var(--color-np-red)] text-white text-sm font-bold hover:bg-[var(--color-np-red-dark)] transition-colors shadow-sm">
            {isEdit ? 'Save Changes' : 'Create Client'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Clients Page ── */
export default function ClientsPage() {
  const router    = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  const { toasts, toast, dismiss } = useToast();

  const [clients,     setClients]     = useState([]);
  const [meta,        setMeta]        = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [editClient,  setEditClient]  = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [deleting,    setDeleting]    = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);

  /* Stable fetch */
  const fetchClients = useCallback(async (pg, search, signal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: LIMIT });
      if (search) params.set('search', search);
      const res  = await fetch(`/api/clients?${params}`, { signal });
      if (res.status === 401) { routerRef.current.push('/login'); return; }
      const data = await res.json();
      setClients(data.clients || []);
      setMeta({ total: data.total ?? 0, page: data.page ?? pg, totalPages: data.totalPages ?? 1 });
    } catch (err) {
      if (err.name === 'AbortError') return;
    } finally {
      setLoading(false);
    }
  }, []);

  /* Reset to page 1 when search changes (skip on mount) */
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    setPage(1);
  }, [debouncedSearch]);

  /* Fetch whenever page or debounced search changes */
  useEffect(() => {
    const ctrl = new AbortController();
    fetchClients(page, debouncedSearch, ctrl.signal);
    return () => ctrl.abort();
  }, [page, debouncedSearch, fetchClients]);

  function openCreate() { setEditClient(null); setShowModal(true); }
  function openEdit(c)  { setEditClient(c);    setShowModal(true); }
  function closeModal() { setShowModal(false); setEditClient(null); }

  function handleSaved(client, isEdit) {
    if (isEdit) {
      toast('Client updated successfully.');
      setClients((prev) => prev.map((c) => c._id === client._id ? client : c));
    } else {
      /* New client → go straight to quotation builder */
      routerRef.current.push(`/quotations/new?clientId=${client._id}`);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || 'Failed to delete client.', 'error');
        return;
      }
      toast('Client deleted.');
      await fetchClients(page, debouncedSearch, new AbortController().signal);
    } catch {
      toast('Network error. Please try again.', 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-np-text)]">Clients</h1>
          <p className="text-sm text-[var(--color-np-muted)] mt-0.5">
            {loading ? 'Loading…' : `${meta.total} client${meta.total !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-np-red)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-np-red-dark)] transition-colors shadow-sm self-start sm:self-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Client
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-np-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, mobile, or company…"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--color-np-border)] bg-white text-sm text-[var(--color-np-text)] placeholder-[var(--color-np-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] focus:border-transparent transition" />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[var(--color-np-red-light)] border-t-[var(--color-np-red)] rounded-full animate-spin" />
          </div>
        )}
        {searchInput && !loading && (
          <button onClick={() => setSearchInput('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-np-muted)] hover:text-[var(--color-np-text)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      {loading && clients.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[var(--color-np-red-light)] border-t-[var(--color-np-red)] rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex-1 bg-white rounded-2xl border border-[var(--color-np-border)] flex flex-col items-center justify-center gap-3 py-20">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-np-gray)] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[var(--color-np-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M12 12a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          </div>
          <p className="text-[var(--color-np-text)] font-semibold">
            {searchInput ? 'No clients match your search' : 'No clients yet'}
          </p>
          <p className="text-sm text-[var(--color-np-muted)]">
            {searchInput ? 'Try different keywords.' : 'Add your first client to get started.'}
          </p>
          {!searchInput && (
            <button onClick={openCreate}
              className="mt-1 px-4 py-2 bg-[var(--color-np-red)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-np-red-dark)] transition-colors">
              Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--color-np-border)] overflow-hidden shadow-sm">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[24%]" /><col className="w-[14%]" /><col className="w-[18%]" />
                <col className="w-[16%]" /><col className="w-[11%]" /><col className="w-[10%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[var(--color-np-border)] bg-[var(--color-np-gray)]">
                  {['Name / Company', 'Mobile', 'Email', 'Location', 'Type', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--color-np-muted)] uppercase text-[11px] tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-np-border)]">
                {clients.map((c) => (
                  <tr key={c._id} className="hover:bg-[var(--color-np-cream)] transition-colors group">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[var(--color-np-text)] truncate">{c.name}</p>
                      {c.company && <p className="text-xs text-[var(--color-np-muted)] truncate mt-0.5">{c.company}</p>}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--color-np-text)]">{c.mobile}</td>
                    <td className="px-4 py-3.5 text-[var(--color-np-muted)] truncate">{c.email || '—'}</td>
                    <td className="px-4 py-3.5 text-[var(--color-np-muted)] truncate">
                      {[c.address?.city, c.address?.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3.5"><TypeBadge type={c.clientType} /></td>
                    <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => router.push(`/clients/${c._id}`)}
                          className="px-3 py-1.5 text-xs font-semibold text-[var(--color-np-red)] border border-[var(--color-np-red)] rounded-lg hover:bg-[var(--color-np-red)] hover:text-white transition-colors">
                          Open
                        </button>
                        <button onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg text-[var(--color-np-muted)] hover:text-[var(--color-np-red)] hover:bg-red-50 transition-colors" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteId(c._id)}
                          className="p-1.5 rounded-lg text-[var(--color-np-muted)] hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[var(--color-np-border)]">
            {clients.map((c) => (
              <div key={c._id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-semibold text-[var(--color-np-text)] truncate">{c.name}</p>
                    {c.company && <p className="text-xs text-[var(--color-np-muted)] truncate">{c.company}</p>}
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-sm text-[var(--color-np-muted)] mb-3">
                  <span>{c.mobile}</span>
                  {c.email && <span className="truncate">{c.email}</span>}
                  {(c.address?.city || c.address?.state) && (
                    <span className="col-span-2">{[c.address.city, c.address.state].filter(Boolean).join(', ')}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <TypeBadge type={c.clientType} />
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/clients/${c._id}`)}
                      className="px-3 py-1.5 text-xs font-semibold text-[var(--color-np-red)] border border-[var(--color-np-red)] rounded-lg hover:bg-[var(--color-np-red)] hover:text-white transition-colors">
                      Open
                    </button>
                    <button onClick={() => openEdit(c)}
                      className="px-3 py-1.5 text-xs font-semibold text-[var(--color-np-muted)] border border-[var(--color-np-border)] rounded-lg hover:bg-[var(--color-np-gray)] transition-colors">
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(c._id)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={LIMIT} onPage={setPage} />
        </div>
      )}

      {/* Client modal */}
      {showModal && <ClientModal client={editClient} onClose={closeModal} onSaved={handleSaved} />}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-np-text)] mb-2">Delete Client</h3>
            <p className="text-sm text-[var(--color-np-muted)] mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--color-np-border)] text-sm font-semibold text-[var(--color-np-text)] hover:bg-[var(--color-np-gray)] transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
