import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';

const empty = {
  company_name: '', registration_no: '', pic_name: '', phone: '',
  email: '', address: '', industry: '', payment_terms: 'NET30',
};

export default function ClientForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/clients/${id}`)
      .then((res) => setForm({ ...empty, ...res.data }))
      .catch(() => setError('Failed to load client'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isEdit) {
        await api.patch(`/clients/${id}`, form);
      } else {
        await api.post('/clients', form);
      }
      navigate('/clients');
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-poppins font-semibold text-bgray-900 dark:text-white mb-6">
        {isEdit ? 'Edit Client' : 'Add Client'}
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-error-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="company_name" value={form.company_name} onChange={handleChange} required
          placeholder="Company name" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        <input name="registration_no" value={form.registration_no} onChange={handleChange} required
          placeholder="Registration number" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        <input name="pic_name" value={form.pic_name} onChange={handleChange} required
          placeholder="Person in charge" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        <input name="phone" value={form.phone} onChange={handleChange} required
          placeholder="Phone" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        <input type="email" name="email" value={form.email} onChange={handleChange} required
          placeholder="Email" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        <input name="address" value={form.address} onChange={handleChange} required
          placeholder="Address" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        <input name="industry" value={form.industry || ''} onChange={handleChange}
          placeholder="Industry" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        <input name="payment_terms" value={form.payment_terms || ''} onChange={handleChange}
          placeholder="Payment terms" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />

        <div className="flex gap-3">
          <button type="submit" disabled={busy}
            className="px-5 py-2.5 rounded-lg bg-success-300 hover:bg-success-400 disabled:opacity-50 text-white font-semibold">
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate('/clients')}
            className="px-5 py-2.5 rounded-lg border border-bgray-300 font-semibold">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
