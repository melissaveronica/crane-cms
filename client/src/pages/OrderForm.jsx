import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const empty = {
  client_id: '', project_name: '', location: '', start_date: '', end_date: '',
  crane_type: '', capacity_tonnes: '', load_weight_kg: '', lift_height_m: '', site_condition: '',
};

export default function OrderForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const needsClientPicker = user?.role !== 'customer';
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!needsClientPicker) return;
    api.get('/clients', { params: { limit: 100 } }).then((res) => setClients(res.data.data));
  }, [needsClientPicker]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFiles = (e) => setFiles(Array.from(e.target.files));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v !== '' && fd.append(k, v));
      files.forEach((f) => fd.append('attachments', f));
      const { data } = await api.post('/orders', fd);   // axios sets the header from FormData automatically
      navigate(`/orders/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-poppins font-semibold text-bgray-900 dark:text-white mb-6">New Order</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-error-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        {needsClientPicker && (
          <select name="client_id" value={form.client_id} onChange={handleChange} required
            className="border border-bgray-300 rounded-lg h-12 w-full px-4">
            <option value="">Select client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
        )}
        <input name="project_name" value={form.project_name} onChange={handleChange} required
          placeholder="Project name" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        <input name="location" value={form.location} onChange={handleChange} required
          placeholder="Location" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm text-bgray-600">Start date</label>
            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required
              className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
          </div>
          <div className="flex-1">
            <label className="text-sm text-bgray-600">End date</label>
            <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required
              className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
          </div>
        </div>
        <input name="crane_type" value={form.crane_type} onChange={handleChange} required
          placeholder="Crane type" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        <div className="flex gap-4">
          <input type="number" step="0.01" name="capacity_tonnes" value={form.capacity_tonnes} onChange={handleChange} required
            placeholder="Capacity (tonnes)" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
          <input type="number" step="0.01" name="load_weight_kg" value={form.load_weight_kg} onChange={handleChange} required
            placeholder="Load weight (kg)" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
          <input type="number" step="0.01" name="lift_height_m" value={form.lift_height_m} onChange={handleChange} required
            placeholder="Lift height (m)" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        </div>
        <textarea name="site_condition" value={form.site_condition} onChange={handleChange}
          placeholder="Site condition (optional)" className="border border-bgray-300 rounded-lg w-full px-4 py-3" rows={3} />

        <div>
          <label className="text-sm text-bgray-600 block mb-1">Attachments (drawings, photos, PDFs)</label>
          <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFiles}
            className="block w-full text-sm" />
          {files.length > 0 && (
            <ul className="mt-2 text-sm text-bgray-600 list-disc list-inside">
              {files.map((f, i) => <li key={i}>{f.name}</li>)}
            </ul>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={busy}
            className="px-5 py-2.5 rounded-lg bg-success-300 hover:bg-success-400 disabled:opacity-50 text-white font-semibold">
            {busy ? 'Submitting…' : 'Create Order'}
          </button>
          <button type="button" onClick={() => navigate('/orders')}
            className="px-5 py-2.5 rounded-lg border border-bgray-300 font-semibold">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
