'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

/* ── Constants ── */
const CLASSIFICATIONS = [
  { value: 'interior', label: 'Interior' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'both',     label: 'Both'     },
];

const PRODUCT_TYPES = [
  { value: 'primer',        label: 'Primer'        },
  { value: 'wall emulsion', label: 'Wall Emulsion'  },
  { value: 'ceiling paint', label: 'Ceiling Paint'  },
  { value: 'waterproof',    label: 'Waterproof'     },
  { value: 'putty',         label: 'Wall Putty'     },
  { value: 'texture',       label: 'Texture'        },
  { value: 'enamel',        label: 'Enamel'         },
  { value: 'distemper',     label: 'Distemper'      },
];

const UNITS = [
  { value: 'L',   label: 'Litre' },
  { value: 'Kg',  label: 'Kg'    },
  { value: 'Gal', label: 'Gal'   },
];

const CLASS_STYLE = {
  interior: 'bg-indigo-50 text-indigo-700',
  exterior: 'bg-amber-50 text-amber-800',
  both:     'bg-green-50 text-green-800',
};

const TYPE_STYLE = {
  'primer':        'bg-purple-50 text-purple-700',
  'wall emulsion': 'bg-blue-50 text-blue-700',
  'ceiling paint': 'bg-emerald-50 text-emerald-700',
  'waterproof':    'bg-cyan-50 text-cyan-700',
  'putty':         'bg-yellow-50 text-yellow-800',
  'texture':       'bg-orange-50 text-orange-700',
  'enamel':        'bg-pink-50 text-pink-700',
  'distemper':     'bg-slate-100 text-slate-600',
};

const newRow = () => ({ _key: Math.random().toString(36).slice(2), qty: '', unit: 'L', price: '' });

/* ── Product Form Modal ── */
function ProductModal({ product, onClose, onSaved, toast }) {
  const isEdit = !!product;
  const [name,  setName]  = useState(product?.name           || '');
  const [cls,   setCls]   = useState(product?.classification || 'interior');
  const [type,  setType]  = useState(product?.productType    || 'wall emulsion');
  const [sizes, setSizes] = useState(
    product?.sizes?.length
      ? product.sizes.map((s) => ({ _key: Math.random().toString(36).slice(2), qty: String(s.qty), unit: s.unit || 'L', price: s.price ? String(s.price) : '' }))
      : [newRow()]
  );
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  const updateSize = (key, field, val) =>
    setSizes((prev) => prev.map((s) => s._key === key ? { ...s, [field]: val } : s));
  const removeSize = (key) =>
    setSizes((prev) => prev.length > 1 ? prev.filter((s) => s._key !== key) : prev);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Product name is required.'); return; }
    const valid = sizes.filter((s) => s.qty && Number(s.qty) > 0);
    if (!valid.length) { setError('Add at least one size with a valid quantity.'); return; }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(), classification: cls, productType: type,
        sizes: valid.map((s) => ({ qty: Number(s.qty), unit: s.unit, price: s.price !== '' ? Number(s.price) : 0 })),
      };
      const url    = isEdit ? `/api/products/${product._id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!res.ok) { setError(data.error || 'Could not save product.'); return; }
      onSaved(data.product, isEdit);
      onClose();
    } catch {
      toast?.('Network error. Please try again.', 'error');
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const inputBase   = 'w-full px-4 py-2.5 rounded-xl border border-[var(--color-np-border)] bg-[var(--color-np-gray)] text-sm text-[var(--color-np-text)] placeholder-[var(--color-np-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] focus:border-transparent transition';
  const selectBase  = inputBase + ' appearance-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
        <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--color-np-border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-np-text)]">{isEdit ? 'Edit Product' : 'New Product'}</h2>
            <p className="text-xs text-[var(--color-np-muted)] mt-0.5">One product can have multiple sizes with different prices.</p>
          </div>
          <button onClick={onClose} className="text-[var(--color-np-muted)] hover:text-[var(--color-np-text)] transition-colors mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-np-text)] mb-1.5">
                Product Name <span className="text-[var(--color-np-red)]">*</span>
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nippon Matex Interior Emulsion" className={inputBase} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-np-text)] mb-1.5">Where Used</label>
                <div className="relative">
                  <select value={cls} onChange={(e) => setCls(e.target.value)} className={selectBase}>
                    {CLASSIFICATIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-np-muted)] text-xs">▾</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-np-text)] mb-1.5">Product Type</label>
                <div className="relative">
                  <select value={type} onChange={(e) => setType(e.target.value)} className={selectBase}>
                    {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-np-muted)] text-xs">▾</div>
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-np-text)] mb-2">
                Sizes <span className="text-[var(--color-np-red)]">*</span>
              </label>
              <div className="rounded-xl border border-[var(--color-np-border)] overflow-hidden">
                <div className="grid grid-cols-[1fr_90px_1fr_34px] gap-0 bg-[var(--color-np-gray)] border-b border-[var(--color-np-border)] px-3 py-2">
                  {['Quantity', 'Unit', 'Price (₹) – optional', ''].map((h) => (
                    <span key={h} className="text-[10px] font-bold text-[var(--color-np-muted)] uppercase tracking-wide">{h}</span>
                  ))}
                </div>
                <div className="divide-y divide-[var(--color-np-border)]">
                  {sizes.map((s) => (
                    <div key={s._key} className="grid grid-cols-[1fr_90px_1fr_34px] items-center px-3 py-2 gap-2 bg-white">
                      <input type="number" min="0.01" step="0.01" placeholder="e.g. 4"
                        value={s.qty} onChange={(e) => updateSize(s._key, 'qty', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[var(--color-np-border)] text-sm bg-[var(--color-np-gray)] focus:outline-none focus:ring-1 focus:ring-[var(--color-np-red)] transition" />
                      <div className="relative">
                        <select value={s.unit} onChange={(e) => updateSize(s._key, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 pr-6 rounded-lg border border-[var(--color-np-border)] text-sm bg-[var(--color-np-gray)] appearance-none focus:outline-none focus:ring-1 focus:ring-[var(--color-np-red)] transition">
                          {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-np-muted)]">▾</div>
                      </div>
                      <input type="number" min="0" step="0.01" placeholder="Optional"
                        value={s.price} onChange={(e) => updateSize(s._key, 'price', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[var(--color-np-border)] text-sm bg-[var(--color-np-gray)] focus:outline-none focus:ring-1 focus:ring-[var(--color-np-red)] transition" />
                      <button type="button" onClick={() => removeSize(s._key)} disabled={sizes.length === 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-np-muted)] hover:bg-red-50 hover:text-red-500 disabled:opacity-25 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => setSizes((prev) => [...prev, newRow()])}
                className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-np-red)] hover:text-[var(--color-np-red-dark)] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Size
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-np-border)] bg-[var(--color-np-gray)]">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--color-np-border)] text-sm font-semibold text-[var(--color-np-text)] hover:bg-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-xl bg-[var(--color-np-red)] text-white text-sm font-bold hover:bg-[var(--color-np-red-dark)] disabled:opacity-60 transition-colors shadow-sm">
              {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── FilterTab ── */
function FilterTab({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
        active
          ? 'bg-[var(--color-np-red)] text-white shadow-sm'
          : 'bg-white text-[var(--color-np-muted)] border border-[var(--color-np-border)] hover:border-[var(--color-np-red)] hover:text-[var(--color-np-red)]'
      }`}>
      {label}
    </button>
  );
}

/* ── Products Page ── */
export default function ProductsPage() {
  const router    = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  const { toasts, toast, dismiss } = useToast();

  const [products,       setProducts]       = useState([]);
  const [meta,           setMeta]           = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState(1);
  const [filterClass,    setFilterClass]    = useState('all');
  const [filterType,     setFilterType]     = useState('all');
  const [searchInput,    setSearchInput]    = useState('');
  const [showModal,      setShowModal]      = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);
  const [deleting,       setDeleting]       = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);

  /* Stable fetch — receives all params explicitly */
  const fetchProducts = useCallback(async (pg, search, cls, typ, signal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: LIMIT });
      if (search) params.set('search', search);
      if (cls && cls !== 'all') params.set('classification', cls);
      if (typ && typ !== 'all') params.set('productType', typ);
      const res  = await fetch(`/api/products?${params}`, { signal });
      if (res.status === 401) { routerRef.current.push('/login'); return; }
      const data = await res.json();
      setProducts(data.products || []);
      setMeta({ total: data.total ?? 0, page: data.page ?? pg, totalPages: data.totalPages ?? 1 });
    } catch (err) {
      if (err.name === 'AbortError') return;
    } finally {
      setLoading(false);
    }
  }, []);

  /* Reset to page 1 when filters or search change (skip mount) */
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    setPage(1);
  }, [debouncedSearch, filterClass, filterType]);

  /* Fetch whenever page, debounced search, or filters change */
  useEffect(() => {
    const ctrl = new AbortController();
    fetchProducts(page, debouncedSearch, filterClass, filterType, ctrl.signal);
    return () => ctrl.abort();
  }, [page, debouncedSearch, filterClass, filterType, fetchProducts]);

  function openCreate() { setEditingProduct(null); setShowModal(true); }
  function openEdit(p)  { setEditingProduct(p);    setShowModal(true); }
  function closeModal() { setShowModal(false);     setEditingProduct(null); }

  function handleSaved(product, isEdit) {
    toast(isEdit ? 'Product updated successfully.' : 'Product created successfully.');
    if (isEdit) {
      setProducts((prev) => prev.map((p) => p._id === product._id ? product : p));
    } else {
      if (page === 1) {
        fetchProducts(1, debouncedSearch, filterClass, filterType, new AbortController().signal);
      } else {
        setPage(1);
      }
    }
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteConfirm._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || 'Failed to delete product.', 'error');
        return;
      }
      toast('Product deleted.');
      await fetchProducts(page, debouncedSearch, filterClass, filterType, new AbortController().signal);
    } catch {
      toast('Network error. Please try again.', 'error');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  }

  const hasFilters = debouncedSearch || filterClass !== 'all' || filterType !== 'all';

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-np-text)]">Products</h1>
          <p className="text-sm text-[var(--color-np-muted)] mt-0.5">
            {loading ? 'Loading…' : `${meta.total} product${meta.total !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-np-red)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-np-red-dark)] transition-colors shadow-sm self-start sm:self-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Filters + search panel */}
      <div className="bg-white rounded-2xl border border-[var(--color-np-border)] shadow-sm px-4 py-4 space-y-3">
        <div className="relative max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-np-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products by name…"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--color-np-border)] text-sm text-[var(--color-np-text)] placeholder-[var(--color-np-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] focus:border-transparent transition" />
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

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-[var(--color-np-muted)] uppercase tracking-widest shrink-0">Where used:</span>
          <FilterTab label="All" active={filterClass === 'all'} onClick={() => setFilterClass('all')} />
          {CLASSIFICATIONS.map((c) => (
            <FilterTab key={c.value} label={c.label} active={filterClass === c.value} onClick={() => setFilterClass(c.value)} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-[var(--color-np-muted)] uppercase tracking-widest shrink-0">Type:</span>
          <FilterTab label="All" active={filterType === 'all'} onClick={() => setFilterType('all')} />
          {PRODUCT_TYPES.map((t) => (
            <FilterTab key={t.value} label={t.label} active={filterType === t.value} onClick={() => setFilterType(t.value)} />
          ))}
        </div>
      </div>

      {/* Content */}
      {loading && products.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[var(--color-np-red-light)] border-t-[var(--color-np-red)] rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex-1 bg-white rounded-2xl border border-[var(--color-np-border)] flex flex-col items-center justify-center gap-3 py-20">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-np-gray)] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[var(--color-np-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <p className="text-[var(--color-np-text)] font-semibold">
            {hasFilters ? 'No products match your filters' : 'No products yet'}
          </p>
          <p className="text-sm text-[var(--color-np-muted)]">
            {hasFilters ? 'Try clearing filters.' : 'Add products like Nippon Matex with multiple sizes.'}
          </p>
          {!hasFilters && (
            <button onClick={openCreate} className="mt-1 px-4 py-2 bg-[var(--color-np-red)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-np-red-dark)] transition-colors">
              Add Product
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--color-np-border)] overflow-hidden shadow-sm">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[32%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[34%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[var(--color-np-border)] bg-[var(--color-np-gray)]">
                  {['Product Name', 'Where Used', 'Type', 'Sizes & Prices', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--color-np-muted)] uppercase text-[11px] tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-np-border)]">
                {products.map((p) => {
                  const typeLabel = PRODUCT_TYPES.find((t) => t.value === p.productType)?.label || p.productType;
                  return (
                    <tr key={p._id} className="hover:bg-[var(--color-np-cream)] transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-[var(--color-np-text)] truncate">{p.name}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${CLASS_STYLE[p.classification] || CLASS_STYLE.interior}`}>
                          {p.classification}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_STYLE[p.productType] || TYPE_STYLE['wall emulsion']}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {(p.sizes || []).map((s, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[var(--color-np-orange-light)] text-orange-800 text-xs font-semibold rounded-lg">
                              {s.qty}{s.unit}
                              {s.price > 0 && <span className="text-orange-600 font-medium">· ₹{s.price}</span>}
                            </span>
                          ))}
                          {!p.sizes?.length && <span className="text-xs text-[var(--color-np-muted)]">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-[var(--color-np-muted)] hover:text-[var(--color-np-red)] hover:bg-red-50 transition-colors" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteConfirm(p)}
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
            {products.map((p) => {
              const typeLabel = PRODUCT_TYPES.find((t) => t.value === p.productType)?.label || p.productType;
              return (
                <div key={p._id} className="p-4">
                  <p className="font-semibold text-[var(--color-np-text)] mb-2">{p.name}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${CLASS_STYLE[p.classification] || CLASS_STYLE.interior}`}>{p.classification}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_STYLE[p.productType] || TYPE_STYLE['wall emulsion']}`}>{typeLabel}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(p.sizes || []).map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-np-orange-light)] text-orange-800 text-xs font-semibold rounded-lg">
                        {s.qty}{s.unit}{s.price > 0 ? ` · ₹${s.price}` : ''}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="px-3 py-1.5 text-xs font-semibold text-[var(--color-np-red)] border border-[var(--color-np-red)] rounded-lg hover:bg-[var(--color-np-red)] hover:text-white transition-colors">Edit</button>
                    <button onClick={() => setDeleteConfirm(p)} className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={LIMIT} onPage={setPage} />
        </div>
      )}

      {showModal && <ProductModal product={editingProduct} onClose={closeModal} onSaved={handleSaved} toast={toast} />}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-np-text)] mb-1">Delete Product</h3>
            <p className="text-sm font-semibold text-[var(--color-np-text)] mb-1">{deleteConfirm.name}</p>
            <p className="text-sm text-[var(--color-np-muted)] mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
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
