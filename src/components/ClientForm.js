'use client';

import { useState, useCallback } from 'react';

const EMPTY = {
  name: '', mobile: '', email: '', company: '', gstNumber: '',
  clientType: 'individual', status: 'active',
  address: { line1: '', line2: '', pincode: '', city: '', district: '', state: '' },
};

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--color-np-text)] mb-1.5">
        {label}{required && <span className="text-[var(--color-np-red)] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

const inp = (err) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm text-[var(--color-np-text)] placeholder-[var(--color-np-muted)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] focus:border-transparent transition ${err ? 'border-red-400 bg-red-50' : 'border-[var(--color-np-border)]'}`;

const sel = (err) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm text-[var(--color-np-text)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] focus:border-transparent transition appearance-none ${err ? 'border-red-400 bg-red-50' : 'border-[var(--color-np-border)]'}`;

function validate(form) {
  const e = {};
  if (!form.name.trim()) e.name = 'Name is required.';
  if (!form.mobile.trim()) e.mobile = 'Mobile number is required.';
  else if (!/^\d{10}$/.test(form.mobile.trim())) e.mobile = 'Must be exactly 10 digits.';
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Invalid email address.';
  if (form.address.pincode && !/^\d{6}$/.test(form.address.pincode)) e.pincode = 'Must be exactly 6 digits.';
  return e;
}

export default function ClientForm({ initialData, clientId, onSuccess, onCancel }) {
  const isEdit = !!clientId;

  const [form, setForm] = useState(() => {
    if (!initialData) return EMPTY;
    return {
      name:       initialData.name       || '',
      mobile:     initialData.mobile     || '',
      email:      initialData.email      || '',
      company:    initialData.company    || '',
      gstNumber:  initialData.gstNumber  || '',
      clientType: initialData.clientType || 'individual',
      status:     initialData.status     || 'active',
      address: {
        line1:    initialData.address?.line1    || '',
        line2:    initialData.address?.line2    || '',
        pincode:  initialData.address?.pincode  || '',
        city:     initialData.address?.city     || '',
        district: initialData.address?.district || '',
        state:    initialData.address?.state    || '',
      },
    };
  });

  const [errors,         setErrors]         = useState({});
  const [submitting,     setSubmitting]     = useState(false);
  const [apiError,       setApiError]       = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus,  setPincodeStatus]  = useState(''); // 'ok' | 'err' | ''

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const setAddr = (field, value) => {
    setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const fetchPincode = useCallback(async (pin) => {
    setPincodeLoading(true);
    setPincodeStatus('');
    try {
      const res  = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      console.log('[Pincode API] response for', pin, data);
      if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length) {
        const po = data[0].PostOffice[0];
        setForm((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            city:     po.Division || '',
            district: po.District || '',
            state:    po.State    || '',
          },
        }));
        setPincodeStatus(`ok:${po.Division}, ${po.District}, ${po.State}`);
      } else {
        setPincodeStatus('err:No location found for this pincode.');
      }
    } catch {
      setPincodeStatus('err:Could not fetch pincode details.');
    } finally {
      setPincodeLoading(false);
    }
  }, []);

  function handlePincodeChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setAddr('pincode', val);
    setErrors((prev) => { const e = { ...prev }; delete e.pincode; return e; });
    if (val.length === 6) {
      fetchPincode(val);
    } else {
      setPincodeStatus('');
      if (val.length < 6) {
        setForm((prev) => ({
          ...prev,
          address: { ...prev.address, city: '', district: '', state: '' },
        }));
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const url    = isEdit ? `/api/clients/${clientId}` : '/api/clients';
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error || 'Something went wrong.'); return; }
      onSuccess(data.client);
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const pincodeOk  = pincodeStatus.startsWith('ok:');
  const pincodeMsg = pincodeStatus.slice(3);

  return (
    <form id="client-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-0">
      {/* ── Basic info ── */}
      <div className="px-6 py-5 border-b border-[var(--color-np-border)]">
        <p className="text-[10px] font-bold text-[var(--color-np-muted)] uppercase tracking-widest mb-4">Basic Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Customer Name" required error={errors.name}>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" className={inp(errors.name)} autoFocus />
          </Field>

          <Field label="Mobile Number" required error={errors.mobile}>
            <input type="tel" value={form.mobile} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" maxLength={10} inputMode="numeric" className={inp(errors.mobile)} />
          </Field>

          <Field label="Email Address" error={errors.email}>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="optional" className={inp(errors.email)} />
          </Field>

          <Field label="Company / Business">
            <input type="text" value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="optional" className={inp(false)} />
          </Field>

          <Field label="GST Number">
            <input type="text" value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value.toUpperCase())} placeholder="optional" maxLength={15} className={inp(false)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Client Type">
              <div className="relative">
                <select value={form.clientType} onChange={(e) => set('clientType', e.target.value)} className={sel(false)}>
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="contractor">Contractor</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-np-muted)] text-xs">▾</div>
              </div>
            </Field>
            <Field label="Status">
              <div className="relative">
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className={sel(false)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-np-muted)] text-xs">▾</div>
              </div>
            </Field>
          </div>
        </div>
      </div>

      {/* ── Address ── */}
      <div className="px-6 py-5">
        <p className="text-[10px] font-bold text-[var(--color-np-muted)] uppercase tracking-widest mb-4">Address</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Address Line 1">
              <input type="text" value={form.address.line1} onChange={(e) => setAddr('line1', e.target.value)} placeholder="House / flat / building no." className={inp(false)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Address Line 2">
              <input type="text" value={form.address.line2} onChange={(e) => setAddr('line2', e.target.value)} placeholder="Street, area, locality" className={inp(false)} />
            </Field>
          </div>

          <Field label="Pincode" error={errors.pincode}>
            <div className="relative">
              <input type="text" value={form.address.pincode} onChange={handlePincodeChange} placeholder="6-digit pincode" maxLength={6} inputMode="numeric" className={inp(errors.pincode)} />
              {pincodeLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[var(--color-np-red-light)] border-t-[var(--color-np-red)] rounded-full animate-spin" />
                </div>
              )}
            </div>
            {pincodeMsg && !pincodeLoading && (
              <p className={`mt-1 text-xs font-medium ${pincodeOk ? 'text-green-600' : 'text-amber-600'}`}>
                {pincodeOk ? '✓ ' : '⚠ '}{pincodeMsg}
              </p>
            )}
          </Field>

          <Field label="City">
            <input type="text" value={form.address.city} onChange={(e) => setAddr('city', e.target.value)} placeholder="Auto-filled from pincode" className={inp(false)} />
          </Field>

          <Field label="District">
            <input type="text" value={form.address.district} onChange={(e) => setAddr('district', e.target.value)} placeholder="Auto-filled from pincode" className={inp(false)} />
          </Field>

          <Field label="State">
            <input type="text" value={form.address.state} onChange={(e) => setAddr('state', e.target.value)} placeholder="Auto-filled from pincode" className={inp(false)} />
          </Field>
        </div>
      </div>

      {/* API error inside form body so it scrolls with content */}
      {apiError && (
        <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <p className="text-sm text-red-600 font-medium">{apiError}</p>
        </div>
      )}

      {/* Hidden submit — footer triggers this via form="client-form" */}
      <button type="submit" className="hidden" aria-hidden="true" />
    </form>
  );
}
