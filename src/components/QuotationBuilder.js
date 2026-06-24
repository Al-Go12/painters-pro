'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  calcInterior, calcExterior, roundUpToHalf,
  DOOR_SIZES, WINDOW_SIZES,
} from '@/lib/calculator';
import { useToast, ToastContainer } from '@/components/Toast';

/* ─────────────────────────────────────────────────────────── helpers */
const fmtINR = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const newId   = () => Math.random().toString(36).slice(2);

/* ─────────────────────────────────────────────────────────── Interior calc modal */
function InteriorCalcModal({ initial, onSave, onClose }) {
  const newRoom   = (n = 1) => ({ id: newId(), name: `Room ${n}`, length: '', width: '', height: '' });
  const newDeduct = () => ({ id: newId(), size: String(DOOR_SIZES[0].area), count: 1 });

  const [unit,          setUnit]          = useState(initial?.unit          || 'ft');
  const [primerCoats,   setPrimerCoats]   = useState(initial?.primerCoats   ?? 1);
  const [interiorCoats, setInteriorCoats] = useState(initial?.interiorCoats ?? 2);
  const [ceilingCoats,  setCeilingCoats]  = useState(initial?.ceilingCoats  ?? 1);
  const [rooms,         setRooms]         = useState(() =>
    initial?.rooms?.length ? initial.rooms.map((r) => ({ ...r, id: newId() })) : [newRoom()]
  );
  const [doors,         setDoors]         = useState(() =>
    initial?.doors?.length ? initial.doors.map((d) => ({ ...d, id: newId() })) : []
  );
  const [windows,       setWindows]       = useState(() =>
    initial?.windows?.length ? initial.windows.map((w) => ({ ...w, id: newId() })) : []
  );
  const [result,  setResult]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const updRoom = (id, f, v) => setRooms((rs) => rs.map((r) => r.id === id ? { ...r, [f]: v } : r));
  const updDeduct = (setter) => (id, f, v) => setter((ds) => ds.map((d) => d.id === id ? { ...d, [f]: v } : d));

  function calculate() {
    setError('');
    const validRooms = rooms.filter((r) => Number(r.length) > 0 && Number(r.width) > 0 && Number(r.height) > 0);
    if (!validRooms.length) { setError('Enter L × W × H for at least one room.'); return; }
    const doorRows   = doors.map((d)   => ({ size: d.size, count: d.count }));
    const windowRows = windows.map((w) => ({ size: w.size, count: w.count }));
    setResult(calcInterior({ rooms: validRooms, doors: doorRows, windows: windowRows, unit, primerCoats, interiorCoats, ceilingCoats }));
  }

  async function handleSave() {
    if (!result) { calculate(); return; }
    setSaving(true);
    const validRooms = rooms.filter((r) => Number(r.length) > 0 && Number(r.width) > 0 && Number(r.height) > 0);
    const doorRows   = doors.map((d)   => ({ size: d.size, count: Number(d.count) }));
    const windowRows = windows.map((w) => ({ size: w.size, count: Number(w.count) }));
    await onSave({
      rooms: validRooms.map(({ name, length, width, height }) => ({ name, length: Number(length), width: Number(width), height: Number(height) })),
      doors: doorRows, windows: windowRows,
      unit, primerCoats, interiorCoats, ceilingCoats,
      ...result, savedAt: new Date().toISOString(),
    });
    setSaving(false);
    onClose();
  }

  const inp = 'w-full px-3 py-2 rounded-xl border border-[var(--color-np-border)] bg-[var(--color-np-gray)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] focus:border-transparent transition';
  const sel = inp + ' appearance-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-np-border)]">
          <div>
            <h2 className="text-base font-bold text-[var(--color-np-text)]">Interior Calculation</h2>
            <p className="text-xs text-[var(--color-np-muted)] mt-0.5">Coverage: 1 L = 110 sq ft</p>
          </div>
          <button onClick={onClose} className="text-[var(--color-np-muted)] hover:text-[var(--color-np-text)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Unit */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[var(--color-np-muted)] uppercase tracking-widest">Unit</span>
            {['ft','m','cm'].map((u) => (
              <button key={u} type="button" onClick={() => setUnit(u)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${unit === u ? 'bg-[var(--color-np-red)] text-white border-[var(--color-np-red)]' : 'bg-white text-[var(--color-np-muted)] border-[var(--color-np-border)] hover:border-[var(--color-np-red)]'}`}>
                {u}
              </button>
            ))}
          </div>

          {/* Rooms */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[var(--color-np-text)]">Rooms</span>
              <button type="button" onClick={() => setRooms((rs) => [...rs, newRoom(rs.length + 1)])}
                className="text-xs font-semibold text-[var(--color-np-red)] hover:text-[var(--color-np-red-dark)] transition-colors">
                + Add Room
              </button>
            </div>
            <div className="rounded-xl border border-[var(--color-np-border)] overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_80px_80px_32px] bg-[var(--color-np-gray)] px-3 py-2 border-b border-[var(--color-np-border)]">
                {['Room Name', 'Length', 'Width', 'Height', ''].map((h) => (
                  <span key={h} className="text-[10px] font-bold text-[var(--color-np-muted)] uppercase tracking-wide">{h}</span>
                ))}
              </div>
              <div className="divide-y divide-[var(--color-np-border)]">
                {rooms.map((r) => (
                  <div key={r.id} className="grid grid-cols-[1fr_80px_80px_80px_32px] items-center gap-2 px-3 py-2">
                    <input placeholder="e.g. Bedroom" value={r.name} onChange={(e) => updRoom(r.id, 'name', e.target.value)} className={inp} />
                    <input type="number" min="0" step="0.1" placeholder="0" value={r.length} onChange={(e) => updRoom(r.id, 'length', e.target.value)} className={inp} />
                    <input type="number" min="0" step="0.1" placeholder="0" value={r.width}  onChange={(e) => updRoom(r.id, 'width',  e.target.value)} className={inp} />
                    <input type="number" min="0" step="0.1" placeholder="0" value={r.height} onChange={(e) => updRoom(r.id, 'height', e.target.value)} className={inp} />
                    <button type="button" onClick={() => setRooms((rs) => rs.length > 1 ? rs.filter((x) => x.id !== r.id) : rs)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-np-muted)] hover:text-red-500 hover:bg-red-50 disabled:opacity-25 transition" disabled={rooms.length === 1}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deductions — doors & windows side by side, each with full-width selects */}
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Doors', items: doors, setItems: setDoors, sizes: DOOR_SIZES, updFn: updDeduct(setDoors) },
              { label: 'Windows', items: windows, setItems: setWindows, sizes: WINDOW_SIZES, updFn: updDeduct(setWindows) },
            ].map(({ label, items, setItems, sizes, updFn }) => (
              <div key={label} className="bg-[var(--color-np-gray)] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-bold text-[var(--color-np-text)]">{label}</span>
                  <button type="button" onClick={() => setItems((ds) => [...ds, newDeduct()])}
                    className="text-xs font-semibold text-[var(--color-np-red)] hover:text-[var(--color-np-red-dark)] transition-colors">+ Add</button>
                </div>
                {!items.length && <p className="text-xs text-[var(--color-np-muted)] italic">None added</p>}
                <div className="space-y-2">
                  {items.map((d) => (
                    <div key={d.id} className="flex items-center gap-2">
                      <select
                        value={d.size}
                        onChange={(e) => updFn(d.id, 'size', e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[var(--color-np-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] focus:border-transparent transition"
                      >
                        {sizes.map((s) => <option key={s.area} value={String(s.area)}>{s.label}</option>)}
                      </select>
                      <input type="number" min="1" value={d.count} onChange={(e) => updFn(d.id, 'count', e.target.value)}
                        className="w-14 px-2 py-2 rounded-xl border border-[var(--color-np-border)] bg-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] transition flex-shrink-0" />
                      <button type="button" onClick={() => setItems((ds) => ds.filter((x) => x.id !== d.id))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-np-muted)] hover:text-red-500 hover:bg-red-50 transition flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Coats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Primer Coats', val: primerCoats, set: setPrimerCoats, opts: [0,1,2] },
              { label: 'Wall Paint Coats', val: interiorCoats, set: setInteriorCoats, opts: [1,2,3] },
              { label: 'Ceiling Coats', val: ceilingCoats, set: setCeilingCoats, opts: [0,1,2] },
            ].map(({ label, val, set, opts }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-[var(--color-np-muted)] mb-1.5">{label}</p>
                <div className="relative">
                  <select value={val} onChange={(e) => set(Number(e.target.value))} className={sel + ' pr-6'}>
                    {opts.map((n) => <option key={n} value={n}>{n} coat{n !== 1 ? 's' : ''}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-np-muted)]">▾</div>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          {/* Results */}
          {result && (
            <div className="bg-[var(--color-np-cream)] rounded-xl border border-[var(--color-np-border)] p-4">
              <p className="text-xs font-bold text-[var(--color-np-muted)] uppercase tracking-widest mb-3">Results</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Net Wall Area', val: `${result.netWallArea.toFixed(1)} sq ft` },
                  { label: 'Ceiling Area',  val: `${result.totalCeilingArea.toFixed(1)} sq ft` },
                  { label: 'Deductions',    val: `−${result.deduction.toFixed(1)} sq ft` },
                  { label: 'Primer',        val: `${roundUpToHalf(result.primerLitres).toFixed(1)} L`, accent: true },
                  { label: 'Wall Paint',    val: `${roundUpToHalf(result.interiorLitres).toFixed(1)} L`, accent: true },
                  { label: 'Ceiling Paint', val: `${roundUpToHalf(result.ceilingLitres).toFixed(1)} L`, accent: true },
                ].map(({ label, val, accent }) => (
                  <div key={label} className={`rounded-xl p-3 text-center ${accent ? 'bg-[var(--color-np-red)] text-white' : 'bg-white border border-[var(--color-np-border)]'}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${accent ? 'text-red-200' : 'text-[var(--color-np-muted)]'}`}>{label}</p>
                    <p className={`text-sm font-black ${accent ? 'text-white' : 'text-[var(--color-np-text)]'}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-np-border)] bg-[var(--color-np-gray)]">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-[var(--color-np-border)] text-sm font-semibold text-[var(--color-np-text)] hover:bg-white transition-colors">Cancel</button>
          {!result
            ? <button type="button" onClick={calculate} className="px-6 py-2.5 rounded-xl bg-[var(--color-np-red)] text-white text-sm font-bold hover:bg-[var(--color-np-red-dark)] transition-colors shadow-sm">Calculate</button>
            : <button type="button" onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-[var(--color-np-red)] text-white text-sm font-bold hover:bg-[var(--color-np-red-dark)] disabled:opacity-60 transition-colors shadow-sm">{saving ? 'Saving…' : 'Save Measurement'}</button>
          }
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── Exterior calc modal */
function ExteriorCalcModal({ initial, onSave, onClose }) {
  const [unit,         setUnit]         = useState(initial?.unit         || 'ft');
  const [length,       setLength]       = useState(initial?.length       || '');
  const [width,        setWidth]        = useState(initial?.width        || '');
  const [height,       setHeight]       = useState(initial?.height       || '');
  const [openArea,     setOpenArea]     = useState(initial?.openArea     || '');
  const [primerCoats,  setPrimerCoats]  = useState(initial?.primerCoats  ?? 1);
  const [paintCoats,   setPaintCoats]   = useState(initial?.paintCoats   ?? 2);
  const [terraceCoats, setTerraceCoats] = useState(initial?.terraceCoats ?? 1);
  const [result,  setResult]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const inp = 'w-full px-3 py-2 rounded-xl border border-[var(--color-np-border)] bg-[var(--color-np-gray)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] focus:border-transparent transition';
  const sel = inp + ' appearance-none';

  function calculate() {
    setError('');
    if (!length || !width || !height) { setError('Enter building L × W × H.'); return; }
    setResult(calcExterior({ length, width, height, unit, openArea: openArea || 0, primerCoats, paintCoats, terraceCoats }));
  }

  async function handleSave() {
    if (!result) { calculate(); return; }
    setSaving(true);
    await onSave({
      length: Number(length), width: Number(width), height: Number(height),
      unit, openArea: Number(openArea) || 0,
      primerCoats, paintCoats, terraceCoats,
      ...result, savedAt: new Date().toISOString(),
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-np-border)]">
          <div>
            <h2 className="text-base font-bold text-[var(--color-np-text)]">Exterior Calculation</h2>
            <p className="text-xs text-[var(--color-np-muted)] mt-0.5">Coverage: 1 L = 110 sq ft</p>
          </div>
          <button onClick={onClose} className="text-[var(--color-np-muted)] hover:text-[var(--color-np-text)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Unit */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[var(--color-np-muted)] uppercase tracking-widest">Unit</span>
            {['ft','m','cm'].map((u) => (
              <button key={u} type="button" onClick={() => setUnit(u)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${unit === u ? 'bg-[var(--color-np-red)] text-white border-[var(--color-np-red)]' : 'bg-white text-[var(--color-np-muted)] border-[var(--color-np-border)] hover:border-[var(--color-np-red)]'}`}>
                {u}
              </button>
            ))}
          </div>

          {/* Building dims */}
          <div>
            <p className="text-sm font-bold text-[var(--color-np-text)] mb-2">Building Dimensions</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Length', val: length, set: setLength },
                { label: 'Width',  val: width,  set: setWidth  },
                { label: 'Height', val: height, set: setHeight },
                { label: 'Open / Balcony Area (sq ft)', val: openArea, set: setOpenArea },
              ].map(({ label, val, set }) => (
                <div key={label} className={label.startsWith('Open') ? 'col-span-2' : ''}>
                  <p className="text-xs font-semibold text-[var(--color-np-muted)] mb-1">{label}</p>
                  <input type="number" min="0" step="0.1" value={val} onChange={(e) => set(e.target.value)} className={inp} />
                </div>
              ))}
            </div>
          </div>

          {/* Coats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Primer Coats',  val: primerCoats,  set: setPrimerCoats,  opts: [0,1,2] },
              { label: 'Wall Paint',    val: paintCoats,   set: setPaintCoats,   opts: [1,2,3] },
              { label: 'Terrace',       val: terraceCoats, set: setTerraceCoats, opts: [0,1,2] },
            ].map(({ label, val, set, opts }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-[var(--color-np-muted)] mb-1.5">{label}</p>
                <div className="relative">
                  <select value={val} onChange={(e) => set(Number(e.target.value))} className={sel + ' pr-6'}>
                    {opts.map((n) => <option key={n} value={n}>{n} coat{n !== 1 ? 's' : ''}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-np-muted)]">▾</div>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          {result && (
            <div className="bg-[var(--color-np-cream)] rounded-xl border border-[var(--color-np-border)] p-4">
              <p className="text-xs font-bold text-[var(--color-np-muted)] uppercase tracking-widest mb-3">Results</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Gross Area',   val: `${result.grossArea.toFixed(1)} sq ft` },
                  { label: 'Terrace',      val: `${result.terraceArea.toFixed(1)} sq ft` },
                  { label: 'Net Area',     val: `${result.netArea.toFixed(1)} sq ft` },
                  { label: 'Primer',       val: `${roundUpToHalf(result.primerLitres).toFixed(1)} L`, accent: true },
                  { label: 'Wall Paint',   val: `${roundUpToHalf(result.paintLitres).toFixed(1)} L`, accent: true },
                  { label: 'Terrace Pnt', val: `${roundUpToHalf(result.terraceLitres).toFixed(1)} L`, accent: true },
                ].map(({ label, val, accent }) => (
                  <div key={label} className={`rounded-xl p-3 text-center ${accent ? 'bg-[var(--color-np-red)] text-white' : 'bg-white border border-[var(--color-np-border)]'}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${accent ? 'text-red-200' : 'text-[var(--color-np-muted)]'}`}>{label}</p>
                    <p className={`text-sm font-black ${accent ? 'text-white' : 'text-[var(--color-np-text)]'}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-np-border)] bg-[var(--color-np-gray)]">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-[var(--color-np-border)] text-sm font-semibold text-[var(--color-np-text)] hover:bg-white transition-colors">Cancel</button>
          {!result
            ? <button type="button" onClick={calculate} className="px-6 py-2.5 rounded-xl bg-[var(--color-np-red)] text-white text-sm font-bold hover:bg-[var(--color-np-red-dark)] transition-colors shadow-sm">Calculate</button>
            : <button type="button" onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-[var(--color-np-red)] text-white text-sm font-bold hover:bg-[var(--color-np-red-dark)] disabled:opacity-60 transition-colors shadow-sm">{saving ? 'Saving…' : 'Save Measurement'}</button>
          }
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── Product picker (search + add) */
function ProductPicker({ products, onAdd }) {
  const [search,   setSearch]   = useState('');
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null); // the chosen product object
  const [showDrop, setShowDrop] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) { setFiltered([]); return; }
    setFiltered(products.filter((p) => p.name.toLowerCase().includes(q) || (p.productType || '').toLowerCase().includes(q)).slice(0, 8));
  }, [search, products]);

  function pick(p) {
    setSelected(p);
    setSearch(p.name);
    setShowDrop(false);
  }

  function clearPicker() {
    setSelected(null);
    setSearch('');
    setFiltered([]);
    inputRef.current?.focus();
  }

  function handleAdd() {
    if (!selected) return;
    const firstSize = (selected.sizes || [])[0];
    onAdd({
      productId:   String(selected._id),
      productName: selected.name,
      productData: selected,
      size:        firstSize ? { qty: firstSize.qty, unit: firstSize.unit, price: firstSize.price || 0 } : null,
      quantity:    1,
      totalLitres: firstSize ? firstSize.qty : 0,
      colourHex:   '',
      amount:      firstSize?.price || 0,
    });
    clearPicker();
  }

  function handleKey(e) {
    if (e.key === 'Enter' && filtered.length > 0 && !selected) { pick(filtered[0]); }
    if (e.key === 'Enter' && selected) { handleAdd(); }
    if (e.key === 'Escape') { clearPicker(); }
  }

  return (
    <div className="px-4 py-3 border-b border-[var(--color-np-border)] bg-[var(--color-np-gray)]">
      <div className="flex items-center gap-2 max-w-lg">
        {/* Search input */}
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-np-muted)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelected(null); setShowDrop(true); }}
            onFocus={() => { if (search) setShowDrop(true); }}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            onKeyDown={handleKey}
            placeholder="Search product by name or type…"
            className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] focus:border-transparent transition ${selected ? 'border-[var(--color-np-red)] bg-red-50 font-semibold text-[var(--color-np-text)]' : 'border-[var(--color-np-border)] bg-white text-[var(--color-np-text)]'}`}
          />
          {search && (
            <button type="button" onMouseDown={clearPicker}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-np-muted)] hover:text-[var(--color-np-text)] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
          {/* Dropdown */}
          {showDrop && filtered.length > 0 && !selected && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--color-np-border)] rounded-xl shadow-xl z-30 overflow-hidden">
              {filtered.map((p) => (
                <button key={String(p._id)} type="button" onMouseDown={() => pick(p)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-np-cream)] transition-colors border-b border-[var(--color-np-border)] last:border-0 flex items-center justify-between gap-3">
                  <span className="font-semibold text-[var(--color-np-text)]">{p.name}</span>
                  <span className="text-xs text-[var(--color-np-muted)] flex-shrink-0 capitalize">{p.productType}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Add button */}
        <button type="button" onClick={handleAdd} disabled={!selected}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-np-red)] text-white text-sm font-bold hover:bg-[var(--color-np-red-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── Line item row (no inline search) */
function LineItem({ item, index, onUpdate, onRemove }) {
  function selectSize(size) {
    const qty = item.quantity || 1;
    onUpdate({ size, totalLitres: size.qty * qty, amount: (size.price || 0) * qty });
  }

  function updateQty(v) {
    const qty = Math.max(1, Number(v) || 1);
    onUpdate({ quantity: qty, totalLitres: (item.size?.qty || 0) * qty, amount: (item.size?.price || 0) * qty });
  }

  const sizes = item.productData?.sizes || [];

  return (
    <tr className="group border-b border-[var(--color-np-border)] hover:bg-[var(--color-np-cream)] transition-colors">
      {/* # */}
      <td className="px-4 py-3 text-sm text-[var(--color-np-muted)] text-center w-10">{index + 1}</td>

      {/* Product name — static */}
      <td className="px-3 py-3">
        <p className="font-semibold text-[var(--color-np-text)] text-sm leading-tight">{item.productName}</p>
        {item.productData?.productType && (
          <p className="text-xs text-[var(--color-np-muted)] mt-0.5 capitalize">{item.productData.productType}</p>
        )}
      </td>

      {/* Size chips */}
      <td className="px-3 py-3 w-48">
        {sizes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {sizes.map((s, i) => {
              const active = item.size?.qty === s.qty && item.size?.unit === s.unit;
              return (
                <button key={i} type="button" onClick={() => selectSize({ qty: s.qty, unit: s.unit, price: s.price || 0 })}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${active ? 'bg-[var(--color-np-red)] text-white border-[var(--color-np-red)]' : 'bg-white text-[var(--color-np-text)] border-[var(--color-np-border)] hover:border-[var(--color-np-red)]'}`}>
                  {s.qty}{s.unit}
                  {s.price ? <span className={`ml-1 ${active ? 'text-red-200' : 'text-[var(--color-np-muted)]'}`}>₹{s.price}</span> : null}
                </button>
              );
            })}
          </div>
        ) : <span className="text-xs text-[var(--color-np-muted)]">No sizes</span>}
      </td>

      {/* Qty */}
      <td className="px-3 py-3 w-20">
        <input type="number" min="1" value={item.quantity || 1} onChange={(e) => updateQty(e.target.value)}
          className="w-full px-2 py-2 rounded-xl border border-[var(--color-np-border)] bg-[var(--color-np-gray)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] transition" />
      </td>

      {/* Colour hex */}
      <td className="px-3 py-3 w-36">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg border-2 border-[var(--color-np-border)] flex-shrink-0"
            style={{ background: item.colourHex && /^#[0-9A-Fa-f]{6}$/.test(item.colourHex) ? item.colourHex : '#f4f4f4' }} />
          <input type="text" maxLength={7} value={item.colourHex || ''}
            onChange={(e) => { let v = e.target.value; if (v && !v.startsWith('#')) v = '#' + v; onUpdate({ colourHex: v }); }}
            placeholder="#RRGGBB"
            className="flex-1 min-w-0 px-2 py-2 rounded-xl border border-[var(--color-np-border)] bg-[var(--color-np-gray)] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] transition" />
        </div>
      </td>

      {/* Unit price */}
      <td className="px-3 py-3 text-sm font-semibold text-[var(--color-np-text)] text-right w-28">
        {item.size?.price ? `₹${fmtINR(item.size.price)}` : <span className="text-[var(--color-np-muted)]">—</span>}
      </td>

      {/* Amount */}
      <td className="px-3 py-3 text-sm font-bold text-[var(--color-np-text)] text-right w-28">
        {item.amount ? `₹${fmtINR(item.amount)}` : <span className="text-[var(--color-np-muted)]">—</span>}
      </td>

      {/* Remove */}
      <td className="px-3 py-3 w-10">
        <button type="button" onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-np-muted)] hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </td>
    </tr>
  );
}

/* ─────────────────────────────────────────────────────────── Main QuotationBuilder */
export default function QuotationBuilder({ quotationId, clientId: initClientId, client: initClient }) {
  const router = useRouter();
  const { toasts, toast, dismiss } = useToast();

  const [quotation,     setQuotation]     = useState(null);
  const [client,        setClient]        = useState(initClient || null);
  const [products,      setProducts]      = useState([]);
  const [items,         setItems]         = useState([]);
  const [notes,         setNotes]         = useState('');
  const [interiorCalc,  setInteriorCalc]  = useState(null);
  const [exteriorCalc,  setExteriorCalc]  = useState(null);
  const [discountType,  setDiscountType]  = useState('flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [showIntCalc,   setShowIntCalc]   = useState(false);
  const [showExtCalc,   setShowExtCalc]   = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [loading,       setLoading]       = useState(true);

  const clientId = initClientId || quotation?.clientId;

  /* Load everything on mount */
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        /* Load all products (for search) */
        const pRes  = await fetch('/api/products?limit=500');
        const pData = await pRes.json();
        setProducts(pData.products || []);

        if (quotationId) {
          /* Edit mode */
          const qRes  = await fetch(`/api/quotations/${quotationId}`);
          const qData = await qRes.json();
          const q     = qData.quotation;
          setQuotation(q);
          /* Re-attach productData from loaded products list so size chips work */
          const productMap = Object.fromEntries((pData.products || []).map((p) => [String(p._id), p]));
          setItems((q.items || []).map((it) => ({ ...it, id: newId(), productData: productMap[String(it.productId)] || null })));
          setNotes(q.notes || '');
          setInteriorCalc(q.interiorCalc || null);
          setExteriorCalc(q.exteriorCalc || null);
          setDiscountType(q.discountType  || 'flat');
          setDiscountValue(q.discountValue || 0);

          /* Load client */
          if (!initClient && q.clientId) {
            const cRes  = await fetch(`/api/clients/${q.clientId}`);
            const cData = await cRes.json();
            setClient(cData.client);
          }
        } else if (initClientId && !initClient) {
          /* New mode — load client info */
          const cRes  = await fetch(`/api/clients/${initClientId}`);
          const cData = await cRes.json();
          setClient(cData.client);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [quotationId, initClientId, initClient]);

  function addItem(productInfo) {
    setItems((prev) => [...prev, { id: newId(), ...productInfo }]);
  }

  function updateItem(id, updates) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i));
  }

  /* Build line items from a calc result. Maps calc output → product types,
     picks the best pack size for the required litres, returns items to add. */
  function buildCalcItems(calcType, calcData) {
    const needs = calcType === 'interior'
      ? [
          { litres: roundUpToHalf(calcData.primerLitres   || 0), type: 'primer',        label: 'Primer' },
          { litres: roundUpToHalf(calcData.interiorLitres || 0), type: 'wall emulsion',  label: 'Wall Paint' },
          { litres: roundUpToHalf(calcData.ceilingLitres  || 0), type: 'ceiling paint',  label: 'Ceiling Paint' },
        ]
      : [
          { litres: roundUpToHalf(calcData.primerLitres  || 0), type: 'primer',       label: 'Primer' },
          { litres: roundUpToHalf(calcData.paintLitres   || 0), type: 'wall emulsion', label: 'Wall Paint' },
          { litres: roundUpToHalf(calcData.terraceLitres || 0), type: 'waterproof',    label: 'Terrace Paint' },
        ];

    const newItems = [];
    for (const { litres, type } of needs) {
      if (litres <= 0) continue;
      /* Match classification: exact type OR 'both' */
      const product = products.find(
        (p) => p.productType === type && (p.classification === calcType || p.classification === 'both')
      ) ?? products.find((p) => p.productType === type); /* fallback: ignore classification */
      if (!product || !product.sizes?.length) continue;

      /* Pick largest pack size ≤ litres (fewer packs); fallback to smallest if all packs > litres */
      const sorted = [...product.sizes].sort((a, b) => b.qty - a.qty);
      const best   = sorted.find((s) => s.qty <= litres) ?? sorted[sorted.length - 1];
      const qty    = Math.ceil(litres / best.qty);

      newItems.push({
        productId:   String(product._id),
        productName: product.name,
        productData: product,
        size:        { qty: best.qty, unit: best.unit, price: best.price || 0 },
        quantity:    qty,
        totalLitres: best.qty * qty,
        colourHex:   '',
        amount:      (best.price || 0) * qty,
      });
    }
    return newItems;
  }

  const totalAmount   = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const dv            = Number(discountValue) || 0;
  const discountAmount = discountType === 'percent' ? Math.round(totalAmount * dv) / 100 : Math.min(dv, totalAmount);
  const grandTotal    = Math.max(totalAmount - discountAmount, 0);

  async function save(status = 'saved') {
    setSaving(true);
    try {
      const payload = {
        items: items.filter((i) => i.productId).map(({ id: _id, productData: _pd, ...rest }) => rest),
        notes, status,
        interiorCalc: interiorCalc || null,
        exteriorCalc: exteriorCalc || null,
        discountType,
        discountValue: dv,
      };

      let res;
      if (quotationId) {
        res = await fetch(`/api/quotations/${quotationId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        res = await fetch('/api/quotations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, ...payload }) });
      }

      const data = await res.json();
      if (!res.ok) { toast(data.error || 'Could not save quotation.', 'error'); return; }

      toast(quotationId ? 'Quotation updated.' : 'Quotation saved.');
      if (!quotationId) {
        router.replace(`/quotations/${data.quotation._id}`);
      } else {
        setQuotation(data.quotation);
      }
    } catch {
      toast('Network error.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function saveIntCalc(calcData) {
    setInteriorCalc(calcData);

    /* Auto-add matching products */
    const suggested = buildCalcItems('interior', calcData);
    if (suggested.length > 0) {
      setItems((prev) => [...prev, ...suggested.map((s) => ({ id: newId(), ...s }))]);
      toast(`Interior measurement saved — ${suggested.length} product${suggested.length > 1 ? 's' : ''} added to quotation.`);
    }

    if (quotationId) {
      const res = await fetch(`/api/quotations/${quotationId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ interiorCalc: calcData }) });
      if (!res.ok) toast('Failed to persist measurement.', 'error');
    } else if (suggested.length === 0) {
      toast('Interior measurement saved.');
    }
  }

  async function saveExtCalc(calcData) {
    setExteriorCalc(calcData);

    /* Auto-add matching products */
    const suggested = buildCalcItems('exterior', calcData);
    if (suggested.length > 0) {
      setItems((prev) => [...prev, ...suggested.map((s) => ({ id: newId(), ...s }))]);
      toast(`Exterior measurement saved — ${suggested.length} product${suggested.length > 1 ? 's' : ''} added to quotation.`);
    }

    if (quotationId) {
      const res = await fetch(`/api/quotations/${quotationId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exteriorCalc: calcData }) });
      if (!res.ok) toast('Failed to persist measurement.', 'error');
    } else if (suggested.length === 0) {
      toast('Exterior measurement saved.');
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-np-red-light)] border-t-[var(--color-np-red)] rounded-full animate-spin" />
      </div>
    );
  }

  const qNum = quotation?.quotationNumber || 'New Quotation';

  return (
    <div className="flex flex-col gap-0 min-h-full">
      {/* ── Top header bar ── */}
      <div className="bg-white border-b border-[var(--color-np-border)] px-6 py-3 flex items-center justify-between gap-4 flex-wrap sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => router.push(`/clients/${clientId}`)}
            className="text-[var(--color-np-muted)] hover:text-[var(--color-np-red)] transition-colors flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="min-w-0">
            <p className="font-black text-[var(--color-np-text)] text-sm leading-none truncate">{client?.name || '—'}</p>
            <p className="text-xs text-[var(--color-np-muted)] mt-0.5">{qNum}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Interior Calc button */}
          <button type="button" onClick={() => setShowIntCalc(true)}
            className={`relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${interiorCalc ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-[var(--color-np-border)] text-[var(--color-np-text)] hover:border-indigo-300 hover:text-indigo-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Interior Calc
            {interiorCalc && <span className="w-2 h-2 rounded-full bg-indigo-500 absolute -top-1 -right-1" />}
          </button>
          {/* Exterior Calc button */}
          <button type="button" onClick={() => setShowExtCalc(true)}
            className={`relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${exteriorCalc ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-[var(--color-np-border)] text-[var(--color-np-text)] hover:border-amber-300 hover:text-amber-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Exterior Calc
            {exteriorCalc && <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-1 -right-1" />}
          </button>
          <div className="w-px h-6 bg-[var(--color-np-border)]" />
          <button type="button" onClick={() => save('draft')} disabled={saving}
            className="px-4 py-2 rounded-xl border border-[var(--color-np-border)] text-xs font-bold text-[var(--color-np-text)] hover:bg-[var(--color-np-gray)] disabled:opacity-50 transition-colors">
            Save Draft
          </button>
          <button type="button" onClick={() => save('saved')} disabled={saving}
            className="px-5 py-2 rounded-xl bg-[var(--color-np-red)] text-white text-xs font-bold hover:bg-[var(--color-np-red-dark)] disabled:opacity-60 transition-colors shadow-sm">
            {saving ? 'Saving…' : 'Save Quotation'}
          </button>
          {quotationId && (
            <>
              <div className="w-px h-6 bg-[var(--color-np-border)]" />
              {/* WhatsApp */}
              {client?.mobile && (
                <button type="button"
                  onClick={() => {
                    const lines = [
                      `*Quotation from PainterPro*`,
                      `Quotation #: ${quotation?.quotationNumber || ''}`,
                      `Client: ${client?.name || ''}`,
                      `Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
                      ``,
                      `*Products:*`,
                      ...(items.map((it, i) => `${i + 1}. ${it.productName}${it.size ? ` (${it.size.qty}${it.size.unit} × ${it.quantity})` : ''} — ₹${fmtINR(it.amount)}`)),
                      ``,
                      `Subtotal: ₹${fmtINR(totalAmount)}`,
                      ...(discountAmount > 0 ? [`Discount: −₹${fmtINR(discountAmount)}`] : []),
                      `*Total: ₹${fmtINR(grandTotal)}*`,
                      ...(notes ? [``, `Notes: ${notes}`] : []),
                    ];
                    const phone = client.mobile.replace(/\D/g, '');
                    window.open(`https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-green-300 bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
              )}
              {/* Print */}
              <button type="button"
                onClick={() => window.open(`/quotations/${quotationId}/print`, '_blank')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--color-np-border)] text-xs font-bold text-[var(--color-np-text)] hover:bg-[var(--color-np-gray)] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Client strip ── */}
      {client && (
        <div className="bg-[var(--color-np-cream)] border-b border-[var(--color-np-border)] px-6 py-2.5 flex items-center gap-6 text-sm flex-wrap">
          <span className="font-bold text-[var(--color-np-text)]">{client.name}</span>
          {client.mobile && <span className="text-[var(--color-np-muted)]">{client.mobile}</span>}
          {client.email  && <span className="text-[var(--color-np-muted)]">{client.email}</span>}
          {(client.address?.city || client.address?.state) && (
            <span className="text-[var(--color-np-muted)]">{[client.address.city, client.address.state].filter(Boolean).join(', ')}</span>
          )}
          <span className="ml-auto text-xs text-[var(--color-np-muted)]">
            {quotation?.createdAt ? new Date(quotation.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('en-IN')}
          </span>
        </div>
      )}

      {/* ── Calc summaries (if saved) ── */}
      {(interiorCalc || exteriorCalc) && (
        <div className="px-6 pt-4 flex gap-3 flex-wrap">
          {interiorCalc && (
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 text-xs">
              <span className="font-bold text-indigo-700">Interior</span>
              <span className="text-indigo-600">{interiorCalc.netWallArea?.toFixed(0)} sq ft net</span>
              <span className="text-indigo-500">·</span>
              <span className="text-indigo-600">Primer {roundUpToHalf(interiorCalc.primerLitres || 0).toFixed(1)} L</span>
              <span className="text-indigo-500">·</span>
              <span className="text-indigo-600">Wall {roundUpToHalf(interiorCalc.interiorLitres || 0).toFixed(1)} L</span>
              <span className="text-indigo-500">·</span>
              <span className="text-indigo-600">Ceiling {roundUpToHalf(interiorCalc.ceilingLitres || 0).toFixed(1)} L</span>
              <button type="button" onClick={() => setShowIntCalc(true)} className="text-indigo-500 hover:text-indigo-700 transition-colors ml-1">Edit</button>
            </div>
          )}
          {exteriorCalc && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs">
              <span className="font-bold text-amber-700">Exterior</span>
              <span className="text-amber-600">{exteriorCalc.netArea?.toFixed(0)} sq ft net</span>
              <span className="text-amber-500">·</span>
              <span className="text-amber-600">Primer {roundUpToHalf(exteriorCalc.primerLitres || 0).toFixed(1)} L</span>
              <span className="text-amber-500">·</span>
              <span className="text-amber-600">Wall {roundUpToHalf(exteriorCalc.paintLitres || 0).toFixed(1)} L</span>
              <span className="text-amber-500">·</span>
              <span className="text-amber-600">Terrace {roundUpToHalf(exteriorCalc.terraceLitres || 0).toFixed(1)} L</span>
              <button type="button" onClick={() => setShowExtCalc(true)} className="text-amber-500 hover:text-amber-700 transition-colors ml-1">Edit</button>
            </div>
          )}
        </div>
      )}

      {/* ── Product line items table ── */}
      <div className="flex-1 px-6 py-4">
        <div className="bg-white rounded-2xl border border-[var(--color-np-border)] shadow-sm overflow-hidden">

          {/* Search + Add bar */}
          <ProductPicker products={products} onAdd={addItem} />

          {/* Empty state */}
          {items.length === 0 && (
            <div className="py-12 flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-np-gray)] flex items-center justify-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[var(--color-np-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>
              </div>
              <p className="text-sm font-semibold text-[var(--color-np-text)]">No products added yet</p>
              <p className="text-xs text-[var(--color-np-muted)]">Search above and click Add to build the quotation.</p>
            </div>
          )}

          {/* Table — desktop */}
          {items.length > 0 && (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-np-gray)] border-b border-[var(--color-np-border)]">
                    <th className="px-4 py-2.5 text-[11px] font-bold text-[var(--color-np-muted)] uppercase tracking-wide w-10 text-center">#</th>
                    <th className="px-3 py-2.5 text-[11px] font-bold text-[var(--color-np-muted)] uppercase tracking-wide text-left">Product</th>
                    <th className="px-3 py-2.5 text-[11px] font-bold text-[var(--color-np-muted)] uppercase tracking-wide text-left">Size</th>
                    <th className="px-3 py-2.5 text-[11px] font-bold text-[var(--color-np-muted)] uppercase tracking-wide w-20 text-center">Qty</th>
                    <th className="px-3 py-2.5 text-[11px] font-bold text-[var(--color-np-muted)] uppercase tracking-wide w-36 text-left">Colour</th>
                    <th className="px-3 py-2.5 text-[11px] font-bold text-[var(--color-np-muted)] uppercase tracking-wide w-28 text-right">Unit Price</th>
                    <th className="px-3 py-2.5 text-[11px] font-bold text-[var(--color-np-muted)] uppercase tracking-wide w-28 text-right">Amount</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <LineItem
                      key={item.id}
                      item={item}
                      index={i}
                      onUpdate={(updates) => updateItem(item.id, updates)}
                      onRemove={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile cards */}
          {items.length > 0 && (
            <div className="md:hidden divide-y divide-[var(--color-np-border)]">
              {items.map((item, i) => {
                const sizes = item.productData?.sizes || [];
                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-[var(--color-np-muted)] font-semibold">#{i + 1}</span>
                        <p className="font-semibold text-[var(--color-np-text)] text-sm mt-0.5">{item.productName}</p>
                        {item.productData?.productType && <p className="text-xs text-[var(--color-np-muted)] capitalize">{item.productData.productType}</p>}
                      </div>
                      <button type="button" onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                        className="text-xs text-red-500 font-semibold flex-shrink-0 ml-2">Remove</button>
                    </div>
                    {sizes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-np-muted)] mb-1.5">Size</p>
                        <div className="flex flex-wrap gap-1.5">
                          {sizes.map((s, si) => {
                            const active = item.size?.qty === s.qty && item.size?.unit === s.unit;
                            return (
                              <button key={si} type="button"
                                onClick={() => updateItem(item.id, { size: { qty: s.qty, unit: s.unit, price: s.price || 0 }, totalLitres: s.qty * (item.quantity || 1), amount: (s.price || 0) * (item.quantity || 1) })}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${active ? 'bg-[var(--color-np-red)] text-white border-[var(--color-np-red)]' : 'bg-white text-[var(--color-np-text)] border-[var(--color-np-border)]'}`}>
                                {s.qty}{s.unit}{s.price ? ` · ₹${s.price}` : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-np-muted)] mb-1">Qty</p>
                        <input type="number" min="1" value={item.quantity || 1}
                          onChange={(e) => { const q = Math.max(1, Number(e.target.value)); updateItem(item.id, { quantity: q, totalLitres: (item.size?.qty || 0) * q, amount: (item.size?.price || 0) * q }); }}
                          className="w-full px-3 py-2 rounded-xl border border-[var(--color-np-border)] bg-[var(--color-np-gray)] text-sm text-center" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-np-muted)] mb-1">Colour</p>
                        <div className="flex items-center gap-1.5">
                          <div className="w-8 h-8 rounded-lg border-2 border-[var(--color-np-border)] flex-shrink-0"
                            style={{ background: item.colourHex && /^#[0-9A-Fa-f]{6}$/.test(item.colourHex) ? item.colourHex : '#f4f4f4' }} />
                          <input type="text" maxLength={7} value={item.colourHex || ''}
                            onChange={(e) => { let v = e.target.value; if (v && !v.startsWith('#')) v = '#' + v; updateItem(item.id, { colourHex: v }); }}
                            placeholder="#RRGGBB"
                            className="flex-1 min-w-0 px-2 py-2 rounded-xl border border-[var(--color-np-border)] bg-[var(--color-np-gray)] text-xs font-mono" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[var(--color-np-border)]">
                      <span className="text-xs text-[var(--color-np-muted)]">
                        {item.size?.price ? `₹${fmtINR(item.size.price)} / unit` : 'No price set'}
                      </span>
                      <span className="font-bold text-[var(--color-np-text)]">
                        {item.amount ? `₹${fmtINR(item.amount)}` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer: notes + totals ── */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-2xl border border-[var(--color-np-border)] shadow-sm">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-np-border)]">
            {/* Notes */}
            <div className="p-5">
              <p className="text-xs font-bold text-[var(--color-np-muted)] uppercase tracking-widest mb-2">Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add notes, special instructions…"
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-np-border)] bg-[var(--color-np-gray)] text-sm text-[var(--color-np-text)] placeholder-[var(--color-np-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] focus:border-transparent transition resize-none"
              />
            </div>

            {/* Totals */}
            <div className="p-5 flex flex-col justify-between">
              <p className="text-xs font-bold text-[var(--color-np-muted)] uppercase tracking-widest mb-3">Summary</p>
              <div className="space-y-2">
                {items.filter((i) => i.productId && i.amount).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-np-muted)] truncate mr-3">{item.productName} ({item.size?.qty}{item.size?.unit} × {item.quantity})</span>
                    <span className="font-semibold text-[var(--color-np-text)] flex-shrink-0">₹{fmtINR(item.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Discount row */}
              <div className="mt-4 pt-4 border-t border-[var(--color-np-border)] space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-np-muted)]">Subtotal</span>
                  <span className="font-semibold text-[var(--color-np-text)]">₹{fmtINR(totalAmount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--color-np-muted)] flex-shrink-0">Discount</span>
                  {/* Type toggle */}
                  <div className="flex rounded-lg border border-[var(--color-np-border)] overflow-hidden flex-shrink-0">
                    {['flat', 'percent'].map((t) => (
                      <button key={t} type="button" onClick={() => setDiscountType(t)}
                        className={`px-3 py-1.5 text-xs font-bold transition-colors ${discountType === t ? 'bg-[var(--color-np-red)] text-white' : 'bg-white text-[var(--color-np-muted)] hover:bg-[var(--color-np-gray)]'}`}>
                        {t === 'flat' ? '₹' : '%'}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number" min="0" step="0.01"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                    className="flex-1 min-w-0 px-3 py-1.5 rounded-xl border border-[var(--color-np-border)] bg-[var(--color-np-gray)] text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] transition"
                  />
                  {discountAmount > 0 && (
                    <span className="text-xs text-red-600 font-semibold flex-shrink-0">−₹{fmtINR(discountAmount)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-np-border)]">
                  <span className="font-bold text-[var(--color-np-text)]">Grand Total</span>
                  <span className="text-xl font-black text-[var(--color-np-red)]">₹{fmtINR(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showIntCalc && (
        <InteriorCalcModal initial={interiorCalc} onSave={saveIntCalc} onClose={() => setShowIntCalc(false)} />
      )}
      {showExtCalc && (
        <ExteriorCalcModal initial={exteriorCalc} onSave={saveExtCalc} onClose={() => setShowExtCalc(false)} />
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
