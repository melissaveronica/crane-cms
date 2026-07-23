import { useEffect, useState } from 'react';
import api from '../lib/api.js';

const LOCKED = [
  ['company_name', 'Company Name'], ['registration_no', 'Registration No.'],
  ['account_email', 'Account Email'], ['industry', 'Industry'], ['payment_terms', 'Payment Terms'],
];
const EDITABLE = [['pic_name', 'PIC Name'], ['phone', 'Phone'], ['address', 'Address']];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ pic_name: '', phone: '', address: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState(null); // 'saving' | 'saved' | error string
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/me/profile')
      .then((res) => {
        if (cancelled) return;
        setProfile(res.data);
        setForm({ pic_name: res.data.pic_name || '', phone: res.data.phone || '', address: res.data.address || '' });
      })
      .catch((err) => { if (!cancelled) setLoadError(err.response?.data?.error || err.message); });
    return () => { cancelled = true; };
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setStatus('saving'); setFieldErrors({});
    try {
      const res = await api.patch('/me/profile', form);
      setProfile((p) => ({ ...p, ...res.data }));
      setStatus('saved');
    } catch (err) {
      setFieldErrors(err.response?.data?.details || {});
      setStatus(err.response?.data?.error || err.message);
    }
  };

  if (loadError) return <div className="p-6 font-urbanist text-error-300">Failed to load profile: {loadError}</div>;
  if (!profile) return <div className="p-6"><div className="h-64 rounded-lg bg-bgray-200 dark:bg-darkblack-500 animate-pulse" /></div>;

  const inputCls = 'w-full rounded-lg border border-bgray-300 dark:border-darkblack-400 dark:bg-darkblack-500 dark:text-white px-3 py-2 font-urbanist text-sm';

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-3xl font-poppins font-semibold text-bgray-900 dark:text-white">Profile</h1>

      <div className="rounded-lg bg-white dark:bg-darkblack-600 p-5 space-y-4">
        <h2 className="font-poppins font-semibold text-bgray-900 dark:text-white">Company information</h2>
        {LOCKED.map(([key, label]) => (
          <div key={key}>
            <label className="block mb-1 font-urbanist text-sm text-bgray-600 dark:text-bgray-100">{label}</label>
            <input value={profile[key] ?? ''} disabled className={`${inputCls} bg-bgray-100 dark:opacity-60 cursor-not-allowed`} />
          </div>
        ))}
        <p className="font-urbanist text-xs text-bgray-500">To change these fields, contact your account manager.</p>
      </div>

      <form onSubmit={save} className="rounded-lg bg-white dark:bg-darkblack-600 p-5 space-y-4">
        <h2 className="font-poppins font-semibold text-bgray-900 dark:text-white">Contact details</h2>
        {EDITABLE.map(([key, label]) => (
          <div key={key}>
            <label htmlFor={key} className="block mb-1 font-urbanist text-sm text-bgray-600 dark:text-bgray-100">{label}</label>
            <input id={key} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={inputCls} />
            {fieldErrors[key] && <p className="mt-1 font-urbanist text-xs text-error-300">{fieldErrors[key][0]}</p>}
          </div>
        ))}
        {fieldErrors._root && <p className="font-urbanist text-xs text-error-300">{fieldErrors._root.join(', ')}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={status === 'saving'}
            className="px-4 py-2 rounded-lg bg-success-300 font-poppins font-semibold text-white disabled:opacity-50">
            {status === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
          {status === 'saved' && <span className="font-urbanist text-sm text-success-400">Saved ✓</span>}
          {status && status !== 'saving' && status !== 'saved' && <span className="font-urbanist text-sm text-error-300">{status}</span>}
        </div>
      </form>
    </div>
  );
}
